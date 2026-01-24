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
            data: { supportStatus: 'PENDING_REJECTION' } // Lock it down
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
