import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/notifications?page=1&limit=20&unreadOnly=false
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const where: any = {
            userId: user!.id,
        }

        if (unreadOnly) {
            where.isRead = false
        }

        const total = await prisma.notification.count({ where })

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        })

        return NextResponse.json({
            success: true,
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}
