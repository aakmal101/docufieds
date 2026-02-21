import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/messaging/messages/voice
 * Save a new voice message record metadata to the DB
 * The actual file should be uploaded by the client directly to Supabase Storage first.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { threadId, mediaPath, mime, durationMs, sizeBytes } = body

        if (!threadId || !mediaPath) {
            return NextResponse.json({ success: false, message: 'threadId and mediaPath required' }, { status: 400 })
        }

        const currentUserId = session.user.id

        // Verify participant
        const participant = await prisma.chatParticipant.findUnique({
            where: { threadId_userId: { threadId, userId: currentUserId } }
        })

        if (!participant) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
        }

        const newMessage = await prisma.chatMessage.create({
            data: {
                threadId,
                senderUserId: currentUserId,
                messageType: 'VOICE',
                mediaPath,
                mediaMime: mime,
                mediaDurationMs: durationMs,
                mediaSizeBytes: sizeBytes
            },
            include: {
                senderUser: {
                    select: { id: true, fullName: true, photoUrl: true, role: true }
                }
            }
        })

        // Update thread lastMessageAt
        await prisma.chatThread.update({
            where: { id: threadId },
            data: { lastMessageAt: newMessage.createdAt }
        })

        // Update sender's lastReadAt so they don't get 'unread' for their own message
        await prisma.chatParticipant.update({
            where: { threadId_userId: { threadId, userId: currentUserId } },
            data: { lastReadAt: new Date() }
        })

        // Create Notifications for ALL OTHER participants
        const otherParticipants = await prisma.chatParticipant.findMany({
            where: {
                threadId,
                userId: { not: currentUserId }
            },
            include: {
                user: true
            }
        })

        const notifications = otherParticipants.map((op: any) => {
            const targetRole = op.user.role || 'INDIVIDUAL'
            let actionUrl = `/dashboard/individual/messages?threadId=${threadId}`

            if (targetRole === 'AGENT') {
                actionUrl = `/dashboard/agent/messages?threadId=${threadId}`
            } else if (targetRole === 'AGENCY') {
                actionUrl = `/dashboard/agency/messages?threadId=${threadId}`
            } else if (targetRole === 'SUPPORT_MEMBER' || targetRole === 'SUPPORT_LEAD' || targetRole === 'ADMIN') {
                actionUrl = `/admin/support/messages?threadId=${threadId}`
            }

            return {
                userId: op.userId,
                title: `New voice message from ${session.user.fullName || 'User'}`,
                message: '🎤 Voice message',
                type: 'MESSAGE',
                priority: 'NORMAL',
                actionUrl: actionUrl,
                isRead: false
            }
        })

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            })
        }

        return NextResponse.json({
            success: true,
            data: newMessage
        })

    } catch (error) {
        console.error('Save voice message error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
