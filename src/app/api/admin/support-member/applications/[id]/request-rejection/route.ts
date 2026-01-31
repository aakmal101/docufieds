import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { reason, category } = await req.json()

        await prisma.rejectionRequest.create({
            data: {
                applicationId: params.id,
                requestedById: member.id,
                reason,
                category: category || 'OTHER',
                status: 'PENDING'
            }
        })

        await prisma.application.update({
            where: { id: params.id },
            data: {
                supportStatus: 'PENDING_REJECTION',
                lastActivityAt: new Date()
            }
        })

        // Log Status Update
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId: params.id,
                fromStatus: 'CURRENT',
                toStatus: 'PENDING_REJECTION',
                changedByType: 'SUPPORT_MEMBER',
                changedByMemberId: member.id,
                notes: `Rejection requested: ${reason}`
            }
        })

        // NOTE: We do NOT notify the user yet. The LEAD must approve it first.
        // But we DO notify the leads (this logic should be in a separate notification service, 
        // but for now we rely on the dashboard filtering by 'PENDING_REJECTION')

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
