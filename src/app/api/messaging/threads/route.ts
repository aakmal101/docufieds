import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messaging/threads
 * Fetch chat threads (chat heads) for the current user,
 * optionally mixing in legacy SupportMessages or legacy Messages as read-only.
 * We'll start with just the new ChatThread models for the "chat head" functionality.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const currentUserId = user!.id

        // Fetch all ChatThreads the user is part of
        const threads = await prisma.chatThread.findMany({
            where: {
                participants: {
                    some: { userId: currentUserId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, individualProfile: { select: { firstName: true, lastName: true } }, photoUrl: true, role: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            },
            take: 30
        })

        // Format for chat head UI
        const formattedThreads = threads.map((t: any) => {
            const me = t.participants.find((p: any) => p.userId === currentUserId)
            const otherParticipants = t.participants.filter((p: any) => p.userId !== currentUserId)
            const lastMessage = t.messages[0] || null

            // Calculate unread: if there's a last message and its createdAt is > my lastReadAt
            let hasUnread = false
            if (lastMessage && me) {
                if (!me.lastReadAt || new Date(lastMessage.createdAt) > new Date(me.lastReadAt)) {
                    hasUnread = true // Simplified unread badge for now
                }
            }

            return {
                id: t.id,
                threadKey: t.threadKey,
                type: t.type,
                lastMessageAt: t.lastMessageAt,
                me: {
                    lastReadAt: me?.lastReadAt,
                    joinedAt: me?.joinedAt
                },
                others: otherParticipants.map((op: any) => ({
                    userId: op.userId,
                    fullName: op.user?.individualProfile ? `${op.user.individualProfile.firstName || ''} ${op.user.individualProfile.lastName || ''}`.trim() : 'Unknown',
                    role: op.user?.role || 'UNKNOWN',
                    photoUrl: op.user?.photoUrl || null
                })),
                lastMessagePreview: lastMessage ? (lastMessage.messageType === 'VOICE' ? '🎤 Voice message' : lastMessage.text) : 'No messages yet',
                hasUnread
            }
        })

        // Bridge Legacy "Message" table conversations (Read-only)
        const legacyMessages = await prisma.message.findMany({
            where: {
                OR: [
                    { userId: currentUserId },
                    { senderId: currentUserId }
                ]
            },
            include: { user: { include: { individualProfile: true } } },
            orderBy: { createdAt: 'desc' }
        })

        // Group legacy messages by the "other" participant
        const legacyGroups = new Map<string, any>()
        for (const msg of legacyMessages) {
            const groupUser = msg.userId === currentUserId ? msg.senderId : msg.userId;

            // Skip grouping if groupUser is somehow missing or is currentUserId
            if (!groupUser || groupUser === currentUserId) continue;

            if (!legacyGroups.has(groupUser)) {
                legacyGroups.set(groupUser, {
                    id: `legacy_user_${groupUser}`,
                    threadKey: `legacy:${groupUser}`,
                    type: 'LEGACY_DM',
                    lastMessageAt: msg.createdAt,
                    me: null, // read-only
                    others: [{
                        userId: groupUser,
                        fullName: msg.user?.individualProfile ? `${msg.user.individualProfile.firstName || ''} ${msg.user.individualProfile.lastName || ''}`.trim() : 'User',
                        role: msg.senderRole,
                        photoUrl: msg.user?.photoUrl || null
                    }],
                    lastMessagePreview: msg.text,
                    hasUnread: msg.userId === currentUserId && !msg.isRead // unread logic from Legacy Message
                })
            }
        }

        const legacyThreads = Array.from(legacyGroups.values())

        // Merge and sort
        const allThreads = [...formattedThreads, ...legacyThreads].sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA;
        })

        return NextResponse.json({
            success: true,
            data: allThreads
        })

    } catch (error) {
        console.error('Fetch threads error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
