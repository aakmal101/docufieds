
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProfileReviewer } from '@/lib/auth/admin-guard'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const authUser = await requireProfileReviewer()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { notes } = await req.json().catch(() => ({ notes: '' }))

        const user = await prisma.user.findUnique({ where: { id: params.id } })
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        if (user.profileStatus === 'PENDING_REVIEW') {
            return NextResponse.json({ message: 'Already pending' })
        }

        // Transaction for atomicity
        await prisma.$transaction([
            // 1. Update User
            prisma.user.update({
                where: { id: params.id },
                data: {
                    profileStatus: 'PENDING_REVIEW',
                    profileReviewedAt: null,
                    profileReviewedById: null,
                    profileReviewNotes: notes || null,
                    isVerified: false
                }
            }),
            // 2. Create Notification
            prisma.notification.create({
                data: {
                    userId: params.id,
                    title: 'Profile Verification Reset',
                    message: 'Your profile verification status has been reset to pending. Please wait for review.',
                    type: 'INFO',
                    priority: 'NORMAL'
                }
            }),
            // 3. Create Audit Log
            prisma.auditLog.create({
                data: {
                    actorUserId: authUser.id,
                    action: 'USER_PROFILE_RESET_PENDING',
                    targetUserId: params.id,
                    metadata: { notes }
                }
            })
        ])

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[API] Reset Profile Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
