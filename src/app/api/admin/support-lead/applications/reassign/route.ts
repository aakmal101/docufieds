import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function POST(req: Request) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { applicationId, newMemberId, reason } = await req.json()

        const member = await prisma.supportTeamMember.findUnique({
            where: { id: newMemberId }
        })
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

        await prisma.$transaction(async (tx) => {
            // Update assignment
            await tx.applicationAssignment.update({
                where: { applicationId },
                data: {
                    memberId: newMemberId,
                    assignmentType: 'REASSIGNED',
                    notes: reason ? `Reassigned: ${reason}` : 'Reassigned manually'
                }
            })

            // Log system message
            await tx.supportMessage.create({
                data: {
                    applicationId,
                    content: `Application reassigned to ${member.fullName}`,
                    messageType: 'SYSTEM',
                    senderType: 'SYSTEM',
                    isInternal: true
                }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to reassign' }, { status: 500 })
    }
}
