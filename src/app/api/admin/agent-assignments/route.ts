
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { agentUserId, targetUserId, applicationId, assignedByUserId } = body

        if (!agentUserId || (!targetUserId && !applicationId)) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
        }

        // Verify uniqueness to prevent duplicates
        const existing = await prisma.agentAssignment.findFirst({
            where: {
                agentUserId,
                targetUserId: targetUserId || null,
                applicationId: applicationId || null,
                status: 'ACTIVE'
            }
        })

        if (existing) {
            return NextResponse.json({ success: false, message: 'Assignment already exists' }, { status: 409 })
        }

        const assignment = await prisma.agentAssignment.create({
            data: {
                agentUserId,
                targetUserId,
                applicationId,
                assignedByUserId, // Should come from session in real app
                status: 'ACTIVE'
            }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                actorUserId: assignedByUserId,
                action: 'AGENT_ASSIGNED',
                targetUserId: agentUserId,
                metadata: { assignmentId: assignment.id, targetUserId, applicationId }
            }
        })

        return NextResponse.json({ success: true, data: assignment })

    } catch (error: any) {
        console.error('Assignment error:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    // Implementation for unassigning if needed
    return NextResponse.json({ success: true })
}
