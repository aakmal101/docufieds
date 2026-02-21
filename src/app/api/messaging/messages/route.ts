import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messaging/messages
 * Fetch messages for a specific thread identifier
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const threadId = searchParams.get('threadId')
        const limitStr = searchParams.get('limit') || '50'
        const beforeStr = searchParams.get('before')

        if (!threadId) {
            return NextResponse.json(
                { success: false, message: 'threadId query param is required' },
                { status: 400 }
            )
        }

        const limit = parseInt(limitStr, 10)
        const currentUserId = session.user.id

        // Legacy Bridge Intercept
        if (threadId.startsWith('legacy_user_')) {
            const groupUser = threadId.replace('legacy_user_', '')

            const legacyMessages = await prisma.message.findMany({
                where: {
                    OR: [
                        { userId: currentUserId, senderId: groupUser },
                        { userId: groupUser, senderId: currentUserId },
                        // Sometimes userId and senderId are identical in legacy systems if self-sent, 
                        // but mainly we want the pairing between currentUserId and groupUser
                    ]
                },
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                take: limit
            })

            // Mark as read if they were unread and sent to me
            await prisma.message.updateMany({
                where: {
                    userId: currentUserId,
                    senderId: groupUser,
                    isRead: false
                },
                data: { isRead: true }
            })

            const mappedLegacy = legacyMessages.map((msg: any) => ({
                id: msg.id,
                threadId: threadId,
                senderUserId: msg.senderId,
                messageType: 'TEXT',
                text: msg.text,
                mediaPath: null,
                mediaMime: null,
                mediaDurationMs: null,
                mediaSizeBytes: null,
                createdAt: msg.createdAt,
                senderUser: {
                    id: msg.senderId,
                    fullName: msg.user?.fullName || 'User',
                    role: msg.senderRole,
                    photoUrl: msg.user?.photoUrl || null
                }
            }))

            return NextResponse.json({
                success: true,
                data: mappedLegacy
            })
        }

        // Auth check: is user in this thread?
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                threadId_userId: { threadId, userId: currentUserId }
            }
        })

        if (!participant) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            )
        }

        const whereCondition: any = { threadId }

        if (beforeStr) {
            whereCondition.createdAt = { lt: new Date(beforeStr) }
        }

        const messages = await prisma.chatMessage.findMany({
            where: whereCondition,
            include: {
                senderUser: {
                    select: { id: true, fullName: true, photoUrl: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' }, // newest first for infinite scroll
            take: limit
        })

        // Also update lastReadAt for the current user
        await prisma.chatParticipant.update({
            where: {
                threadId_userId: { threadId, userId: currentUserId }
            },
            data: {
                lastReadAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            data: messages // Return newest first, UI usually reverses this
        })

    } catch (error) {
        console.error('Fetch messages error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/messaging/messages
 * Send a new text message to a thread
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { threadId, text } = body

        if (!threadId) {
            return NextResponse.json({ success: false, message: 'threadId is required' }, { status: 400 })
        }

        // Must be text
        if (!text || !text.trim()) {
            return NextResponse.json({ success: false, message: 'Message text is required' }, { status: 400 })
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
                messageType: 'TEXT',
                text: text.trim()
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
            // Figure out a base target URL to deep link based on role
            // Since this API could be called from anywhere, we dynamically construct
            // the link. e.g. /dashboard/{role}/messages?threadId=...
            const targetRole = op.user.role || 'INDIVIDUAL'
            let actionUrl = `/dashboard/individual/messages?threadId=${threadId}`

            if (targetRole === 'AGENT') {
                actionUrl = `/dashboard/agent/messages?threadId=${threadId}`
            } else if (targetRole === 'AGENCY') {
                actionUrl = `/dashboard/agency/messages?threadId=${threadId}`
            } else if (targetRole === 'SUPPORT_MEMBER' || targetRole === 'SUPPORT_LEAD' || targetRole === 'ADMIN') {
                actionUrl = `/admin/support/messages?threadId=${threadId}`
                // Or wherever support actually handles everything. We'll refine this later.
            }

            return {
                userId: op.userId,
                title: `New message from ${session.user.fullName || 'User'}`,
                message: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
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
        console.error('Send message error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
