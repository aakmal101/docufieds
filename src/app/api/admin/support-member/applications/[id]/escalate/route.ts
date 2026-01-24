import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { reason } = await req.json()

        await prisma.escalation.create({
            data: {
                applicationId: params.id,
                escalatedById: member.id,
                reason,
                priority: 'HIGH',
                status: 'PENDING'
            }
        })

        await prisma.application.update({
            where: { id: params.id },
            data: { supportStatus: 'ESCALATED' }
        })

        // Update assignment status? 
        // Maybe keep active but flagged.

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
