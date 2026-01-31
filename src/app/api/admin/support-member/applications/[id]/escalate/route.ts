import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { reason } = await req.json()

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ error: 'Reason is required (min 5 chars)' }, { status: 400 })
        }

        const app = await prisma.application.findUnique({
            where: { id: params.id },
            select: { status: true, supportStatus: true }
        })

        if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

        // 🛡️ Hardening: Prevent escalating finalized/invalid applications
        const invalidStatuses = ['COMPLETED', 'DECLINED', 'REJECTED']
        if (invalidStatuses.includes(app.status) || app.supportStatus === 'REJECTED') {
            return NextResponse.json({ error: `Cannot escalate application in ${app.status} state` }, { status: 400 })
        }

        if (app.supportStatus === 'ESCALATED') {
            return NextResponse.json({ success: true, message: 'Already escalated' }) // Idempotent success
        }

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
