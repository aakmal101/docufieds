import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function POST(req: Request) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { applicationId, memberId, priority = 'NORMAL', notes } = body

        if (!applicationId || !memberId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify member exists
        const member = await prisma.supportTeamMember.findUnique({
            where: { id: memberId }
        })

        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

        const result = await prisma.$transaction(async (tx) => {
            // Create assignment
            const assignment = await tx.applicationAssignment.create({
                data: {
                    applicationId,
                    memberId,
                    assignedById: session.user.id, // Assuming session.user.id is accessible
                    priority,
                    notes,
                    status: 'ACTIVE'
                }
            })

            // Update application status
            await tx.application.update({
                where: { id: applicationId },
                data: {
                    supportStatus: 'ASSIGNED',
                    assignedAt: new Date(),
                }
            })

            // Create system message
            await tx.supportMessage.create({
                data: {
                    applicationId,
                    content: `Application assigned to ${member.fullName}`,
                    messageType: 'SYSTEM',
                    senderType: 'SYSTEM',
                    isInternal: true
                }
            })

            // Log status update
            await tx.applicationStatusUpdate.create({
                data: {
                    applicationId,
                    fromStatus: 'PENDING_ASSIGNMENT',
                    toStatus: 'ASSIGNED',
                    changedByType: 'SUPPORT_LEAD',
                    changedById: session.user.id,
                    notes: `Assigned to ${member.fullName}`
                }
            }
            })

        // Create notification for member
        await tx.notification.create({
            data: {
                memberId,
                title: 'New Application Assigned',
                message: `You have been assigned application #${applicationId} with ${priority} priority.`,
                type: 'ASSIGNMENT',
                priority: 'HIGH',
                actionUrl: `/admin/support-member/applications/${applicationId}`
            }
        })

        return assignment
    })

    return NextResponse.json({ success: true, assignment: result })
} catch (error: any) {
    // Check for unique constraint violation (already assigned)
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Application already assigned' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to assign application' }, { status: 500 })
}
}
