import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { verifySupportMemberToken } from '@/middleware/support-member'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check - Support both NextAuth session AND support-member-token
        let actorUserId: string | null = null

        // Try NextAuth session first (for ADMIN users)
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            // Check if ADMIN or lookup support member
            const member = await prisma.supportTeamMember.findUnique({
                where: { email: session.user.email! },
            })
            if (member || session.user.role === 'ADMIN') {
                actorUserId = session.user.id
            }
        }

        // Fallback: Try support-member-token JWT (for Support Lead & Support Team Member)
        if (!actorUserId) {
            const memberPayload = await verifySupportMemberToken(request)
            if (memberPayload?.id) {
                // Lookup the support member to get their leadId (a valid User.id)
                // SupportTeamMember.id is NOT a User.id, so we use leadId for FK constraints
                const member = await prisma.supportTeamMember.findUnique({
                    where: { id: memberPayload.id },
                    select: { id: true, email: true, leadId: true }
                })
                if (member) {
                    actorUserId = member.leadId // leadId IS a valid User.id
                }
            }
        }

        if (!actorUserId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { targetUserId, applicationId, slotCount = 1, slots, expiresInHours = 24 } = body

        const ALLOWED_EXPIRY = [1, 2, 4, 24, 48, 72]
        if (!targetUserId || slotCount < 1) {
            return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 })
        }
        if (!ALLOWED_EXPIRY.includes(expiresInHours)) {
            return NextResponse.json({ success: false, message: `Invalid expiry. Allowed: ${ALLOWED_EXPIRY.join(', ')} hours` }, { status: 400 })
        }

        // 2. Generate Secure Token
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        // 3. Calculate Expiry
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + expiresInHours)

        // 4. Create Session & Slots Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Session
            // Use 'as any' for new models if types aren't generated yet or cached
            const uploadSession = await (tx as any).uploadSession.create({
                data: {
                    tokenHash,
                    createdByUserId: actorUserId!,
                    targetUserId,
                    applicationId,
                    slotCount,
                    expiresAt,
                    status: 'ACTIVE'
                }
            })

            // Create Slots
            for (let i = 0; i < slotCount; i++) {
                const providedSlot = slots && slots[i] ? slots[i] : {}
                await (tx as any).uploadSlot.create({
                    data: {
                        uploadSessionId: uploadSession.id,
                        slotIndex: i,
                        label: providedSlot.label || `Document ${i + 1}`,
                        documentTypeId: providedSlot.documentTypeId,
                        status: 'EMPTY'
                    }
                })
            }

            // Audit Log
            await tx.auditLog.create({
                data: {
                    actorUserId: actorUserId!,
                    action: 'UPLOAD_SESSION_CREATED',
                    targetUserId,
                    metadata: { sessionId: uploadSession.id, slotCount }
                }
            })

            return uploadSession
        })

        // 5. Return Response (Include rawToken only here)
        // Construct share URL (assumption on verify host)
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        const host = request.headers.get('host')
        const shareUrl = `${protocol}://${host}/upload/${rawToken}`

        return NextResponse.json({
            success: true,
            data: {
                sessionId: result.id,
                shareUrl,
                expiresAt: result.expiresAt,
                rawToken // For manual copy if needed
            }
        })

    } catch (error: any) {
        console.error('Error creating upload session:', error)
        const message = error?.message?.includes('Foreign key constraint')
            ? 'Invalid user reference. Please try again or contact admin.'
            : `Upload session error: ${error?.message || 'Unknown error'}`
        return NextResponse.json({ success: false, message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        // Auth Check - Support both NextAuth session AND support-member-token
        let authenticated = false

        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
            authenticated = true
        }

        if (!authenticated) {
            const memberPayload = await verifySupportMemberToken(request)
            if (memberPayload?.id) {
                authenticated = true
            }
        }

        if (!authenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const applicationId = searchParams.get('applicationId')
        const targetUserId = searchParams.get('targetUserId')
        const recent = searchParams.get('recent')

        if (!applicationId && !targetUserId && !recent) {
            return NextResponse.json({ success: false, message: 'Filter required' }, { status: 400 })
        }

        const whereClause: any = {}
        if (applicationId) whereClause.applicationId = applicationId
        if (targetUserId) whereClause.targetUserId = targetUserId
        // If recent is true, we don't add specific filters, just return latest

        // Expiry sweep: mark any ACTIVE sessions past their expiresAt as EXPIRED
        await (prisma as any).uploadSession.updateMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { lt: new Date() }
            },
            data: { status: 'EXPIRED' }
        })

        const sessions = await (prisma as any).uploadSession.findMany({
            where: whereClause,
            take: recent ? 50 : undefined,
            include: {
                createdByUser: {
                    select: { id: true, fullName: true, email: true }
                },
                targetUser: {
                    select: { id: true, fullName: true, email: true }
                },
                slots: {
                    orderBy: { slotIndex: 'asc' },
                    include: {
                        uploadedDocument: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: sessions })

    } catch (error: any) {
        console.error('Error fetching upload sessions:', error)
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
