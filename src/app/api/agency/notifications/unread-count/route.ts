import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/notifications/unread-count
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const count = await prisma.notification.count({
            where: {
                userId: user!.id,
                isRead: false,
            },
        })

        return NextResponse.json({
            success: true,
            data: { count },
        })
    } catch (error) {
        console.error('Error fetching unread count:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch count' },
            { status: 500 }
        )
    }
}
