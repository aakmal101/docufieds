import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/notifications/unread-count
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
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
