import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/agency/notifications/mark-all-read
export async function POST() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'All notifications marked as read',
        })
    } catch (error) {
        console.error('Error marking all as read:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update notifications' },
            { status: 500 }
        )
    }
}
