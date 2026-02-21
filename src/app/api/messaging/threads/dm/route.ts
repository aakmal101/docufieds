import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/messaging/threads/dm
 * Get or create a 1-to-1 conversation thread between the current user and target user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { otherUserId } = body

        if (!otherUserId) {
            return NextResponse.json(
                { success: false, message: 'otherUserId is required' },
                { status: 400 }
            )
        }

        const currentUserId = session.user.id

        if (currentUserId === otherUserId) {
            return NextResponse.json(
                { success: false, message: 'Cannot create a thread with yourself' },
                { status: 400 }
            )
        }

        // Establish deterministic thread key
        const sortedIds = [currentUserId, otherUserId].sort()
        const threadKey = `dm:${sortedIds[0]}:${sortedIds[1]}`

        // Try to find the existing thread
        let thread = await prisma.chatThread.findUnique({
            where: { threadKey },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, photoUrl: true, role: true }
                        }
                    }
                }
            }
        })

        // If it doesn't exist, create it
        if (!thread) {
            // Check if other user actually exists
            const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } })
            if (!otherUser) {
                return NextResponse.json(
                    { success: false, message: 'Target user not found' },
                    { status: 404 }
                )
            }

            thread = await prisma.chatThread.create({
                data: {
                    threadKey,
                    type: 'DM',
                    participants: {
                        create: [
                            { userId: currentUserId, roleSnapshot: session.user.role },
                            { userId: otherUserId, roleSnapshot: otherUser.role }
                        ]
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, photoUrl: true, role: true }
                            }
                        }
                    }
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                threadId: thread.id,
                threadKey: thread.threadKey,
                participants: thread.participants
            },
        })
    } catch (error) {
        console.error('Thread creation error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
