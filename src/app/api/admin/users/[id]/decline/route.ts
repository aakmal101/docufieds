import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProfileReviewer } from '@/lib/auth/admin-guard'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await requireProfileReviewer()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { reason } = await req.json()

        if (!reason || reason.length < 3) {
            return NextResponse.json({ error: 'Reason is required (min 3 chars)' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { id: params.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // Transaction
        await prisma.$transaction([
            // 1. Update User
            prisma.user.update({
                where: { id: params.id },
                data: {
                    profileStatus: 'DECLINED',
                    profileReviewedAt: new Date(),
                    profileReviewedById: session.user.id,
                    profileReviewNotes: reason,
                    isVerified: false
                }
            }),
            // 2. Create Notification
            prisma.notification.create({
                data: {
                    userId: params.id,
                    title: 'Profile Declined',
                    message: `Your profile verification was declined. Reason: ${reason}`,
                    type: 'ERROR',
                    priority: 'HIGH'
                }
            }),
            // 3. Create Audit Log
            prisma.auditLog.create({
                data: {
                    actorUserId: session.user.id,
                    action: 'USER_PROFILE_DECLINED',
                    targetUserId: params.id,
                    metadata: { reason }
                }
            })
        ])

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[API] Decline Profile Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
