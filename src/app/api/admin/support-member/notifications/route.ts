import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

// GET: Fetch notifications
export async function GET(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const notifications = await prisma.notification.findMany({
            where: { memberId: member.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Fetch notifications error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

// PATCH: Mark single as read
export async function PATCH(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { notificationId } = await req.json()

        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

// PUT: Mark all as read
export async function PUT(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await prisma.notification.updateMany({
            where: { memberId: member.id, isRead: false },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
