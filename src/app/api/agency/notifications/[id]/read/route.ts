import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/agency/notifications/[id]/read
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser()

        if (!user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const notification = await prisma.notification.updateMany({
            where: {
                id: params.id,
                userId: user!.id,
            },
            data: {
                isRead: true,
            },
        })

        if (notification.count === 0) {
            return NextResponse.json(
                { success: false, error: 'Notification not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Notification marked as read',
        })
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update notification' },
            { status: 500 }
        )
    }
}
