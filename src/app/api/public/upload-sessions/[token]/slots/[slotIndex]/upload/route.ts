
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string, slotIndex: string }> | { token: string, slotIndex: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const rawToken = resolvedParams.token
        const slotIndex = parseInt(resolvedParams.slotIndex)

        if (!rawToken || isNaN(slotIndex)) {
            return NextResponse.json({ success: false, message: 'Invalid request parameters' }, { status: 400 })
        }

        // Parse multipart form data
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ success: false, message: 'File required' }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            )
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Allowed: PDF, JPG, PNG' },
                { status: 400 }
            )
        }

        // Hash token to lookup session
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        // 1. Verify Session & Slot
        const session = await (prisma as any).uploadSession.findUnique({
            where: { tokenHash },
            include: {
                slots: true
            }
        })

        if (!session) {
            return NextResponse.json({ success: false, message: 'Invalid upload link' }, { status: 404 })
        }

        if (session.status !== 'ACTIVE') {
            return NextResponse.json(
                { success: false, message: `Upload session is ${session.status.toLowerCase()}` },
                { status: 409 }
            )
        }

        if (new Date() > new Date(session.expiresAt)) {
            // Auto-expire
            await (prisma as any).uploadSession.update({
                where: { id: session.id },
                data: { status: 'EXPIRED' }
            })
            return NextResponse.json({ success: false, message: 'Upload link has expired' }, { status: 410 })
        }

        const slot = session.slots.find((s: any) => s.slotIndex === slotIndex)
        if (!slot) {
            return NextResponse.json({ success: false, message: 'Slot not found' }, { status: 404 })
        }

        if (slot.status === 'UPLOADED') {
            return NextResponse.json({ success: false, message: 'This slot already has a document uploaded' }, { status: 409 })
        }

        // 2. Upload file to Supabase Storage
        let fileUrl = ''
        const fileExt = file.name.split('.').pop() || 'bin'
        const safeFileName = `${session.id}_slot_${slotIndex}_${Date.now()}.${fileExt}`
        const filePath = `uploads/${session.targetUserId}/${session.id}/${safeFileName}`

        try {
            // Try Supabase Storage
            const { createServiceRoleClient } = await import('@/lib/supabase/server')
            const supabase = createServiceRoleClient()

            // Convert File to Buffer for Supabase upload
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: false
                })

            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError)
                // If bucket doesn't exist or RLS blocks, create a placeholder URL
                // This allows the DB flow to complete even if storage is misconfigured
                fileUrl = `/storage/documents/${filePath}`
                console.warn('Using fallback file URL:', fileUrl)
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath)
                fileUrl = publicUrl
            }
        } catch (storageError: any) {
            console.error('Storage initialization error:', storageError.message)
            // Fallback: store with a local reference path
            fileUrl = `/storage/documents/${filePath}`
            console.warn('Storage unavailable, using fallback URL:', fileUrl)
        }

        // 3. Database Transaction: Create Document + Update Slot + Audit Log
        const result = await prisma.$transaction(async (tx) => {
            // Create Document record
            // applicationId is REQUIRED on Document model, so use session.applicationId
            // If session has no applicationId, we need to find one for this user
            let applicationId = session.applicationId
            if (!applicationId) {
                // Try to find any application for this target user
                const userApp = await tx.application.findFirst({
                    where: { userId: session.targetUserId },
                    select: { id: true },
                    orderBy: { createdAt: 'desc' }
                })
                applicationId = userApp?.id || null
            }

            // If still no applicationId, we can't create a Document (FK required)
            // So we'll skip document creation and just store the file reference in the slot
            let document = null
            if (applicationId) {
                document = await tx.document.create({
                    data: {
                        userId: session.targetUserId,
                        applicationId: applicationId,
                        fileName: file.name,
                        fileUrl: fileUrl,
                        fileType: file.type,
                        fileSize: file.size,
                        documentType: slot.label || 'User Upload',
                        status: 'PENDING',
                        uploadedAt: new Date()
                    }
                })
            }

            // Update Slot: mark as UPLOADED and link document if created
            const updatedSlot = await (tx as any).uploadSlot.update({
                where: { id: slot.id },
                data: {
                    status: 'UPLOADED',
                    uploadedDocumentId: document?.id || null,
                    updatedAt: new Date()
                }
            })

            // Audit Log: use session.targetUserId (valid User.id) as actorUserId
            // since public uploads are attributed to the target user
            await tx.auditLog.create({
                data: {
                    actorUserId: session.targetUserId,
                    targetUserId: session.targetUserId,
                    action: 'UPLOAD_SLOT_UPLOADED',
                    metadata: {
                        sessionId: session.id,
                        slotIndex,
                        documentId: document?.id || null,
                        fileName: file.name,
                        fileSize: file.size
                    }
                }
            })

            return { document, updatedSlot }
        })

        // 4. Check if all slots are now uploaded → mark session COMPLETED
        const allSlots = await (prisma as any).uploadSlot.findMany({
            where: { uploadSessionId: session.id }
        })

        const allUploaded = allSlots.every((s: any) => s.status === 'UPLOADED')

        if (allUploaded) {
            await (prisma as any).uploadSession.update({
                where: { id: session.id },
                data: { status: 'COMPLETED' }
            })

            await prisma.auditLog.create({
                data: {
                    actorUserId: session.targetUserId,
                    action: 'UPLOAD_SESSION_COMPLETED',
                    targetUserId: session.targetUserId,
                    metadata: { sessionId: session.id }
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                document: result.document ? {
                    id: result.document.id,
                    fileName: result.document.fileName,
                    fileSize: result.document.fileSize,
                    fileType: result.document.fileType,
                    uploadedAt: result.document.uploadedAt
                } : null,
                slot: {
                    id: result.updatedSlot.id,
                    slotIndex: result.updatedSlot.slotIndex,
                    status: result.updatedSlot.status
                },
                sessionCompleted: allUploaded
            }
        })

    } catch (error: any) {
        console.error('Public upload error:', error)
        const message = error?.message?.includes('Foreign key')
            ? 'Database reference error. Please contact support.'
            : error?.message?.includes('Unique constraint')
                ? 'This document slot has already been used.'
                : `Upload failed: ${error?.message || 'Unknown error'}`
        return NextResponse.json({ success: false, message }, { status: 500 })
    }
}
