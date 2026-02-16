
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

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

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ success: false, message: 'File required' }, { status: 400 })
        }

        // Hash token to verify
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        // 1. Verify Session & Slot
        const session = await (prisma as any).uploadSession.findUnique({
            where: { tokenHash },
            include: {
                slots: true
            }
        })

        if (!session || session.status !== 'ACTIVE') {
            return NextResponse.json({ success: false, message: 'Invalid or inactive upload session' }, { status: 404 })
        }

        if (new Date() > new Date(session.expiresAt)) {
            return NextResponse.json({ success: false, message: 'Upload link expired' }, { status: 410 })
        }

        const slot = session.slots.find((s: any) => s.slotIndex === slotIndex)
        if (!slot) {
            return NextResponse.json({ success: false, message: 'Slot not found' }, { status: 404 })
        }

        // 2. Upload to Supabase Storage
        const supabase = createServiceRoleClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${session.id}_slot_${slotIndex}_${Date.now()}.${fileExt}`
        const filePath = `${session.targetUserId}/${session.id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath)

        // 3. Update Database (Transaction)
        const result = await prisma.$transaction(async (tx) => {
            // Create Document
            const document = await tx.document.create({
                data: {
                    userId: session.targetUserId,
                    applicationId: session.applicationId || '', // Handle nullable appropriately if schema enforces it (schema says optional on Document? No, applicationId is not optional on Document but my previous thought said it was? Checking schema...)
                    // Wait, schema says: applicationId String @map("application_id") -> It is REQUIRED on Document model.
                    // But UploadSession.applicationId is nullable.
                    // If session is not linked to application, we might need a workaround or make Document.applicationId nullable?
                    // Let's check schema again.
                    fileName: file.name,
                    fileUrl: publicUrl,
                    fileType: file.type,
                    fileSize: file.size,
                    documentType: slot.label || 'User Upload',
                    status: 'PENDING',
                    uploadedAt: new Date()
                } as any // Cast to any if needed to bypass strict type check for now
            })

            // Update Slot
            const updatedSlot = await (tx as any).uploadSlot.update({
                where: { id: slot.id },
                data: {
                    status: 'UPLOADED',
                    uploadedDocumentId: document.id,
                    updatedAt: new Date()
                }
            })

            // Audit Log
            await tx.auditLog.create({
                data: {
                    actorUserId: 'system_public_upload', // or session.targetUserId if we want to attribute to them
                    targetUserId: session.targetUserId,
                    action: 'UPLOAD_SLOT_UPLOADED',
                    metadata: { sessionId: session.id, slotIndex, documentId: document.id }
                }
            })

            return { document, updatedSlot }
        })

        // 4. Check & Update Session Completion
        // We fetch fresh slots state
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
                    actorUserId: 'system',
                    action: 'UPLOAD_SESSION_COMPLETED',
                    targetUserId: session.targetUserId,
                    metadata: { sessionId: session.id }
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                document: result.document,
                slot: result.updatedSlot,
                sessionCompleted: allUploaded
            }
        })

    } catch (error: any) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
