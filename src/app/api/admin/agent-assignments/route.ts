
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/services/auth-service'

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { agentUserId, targetUserId, applicationId } = body

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
                assignedByUserId: user.id,
                status: 'ACTIVE'
            }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                actorUserId: user.id,
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
