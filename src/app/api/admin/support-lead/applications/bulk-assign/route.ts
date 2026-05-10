import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function POST(req: Request) {
    const user = await requireSupportLead()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { applicationIds, memberId } = await req.json()

        if (!applicationIds?.length || !memberId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const member = await prisma.user.findFirst({
            where: { id: memberId, role: 'SUPPORT' }
        })

        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

        // Transaction for bulk ops
        const count = await prisma.$transaction(async (tx) => {
            let successCount = 0;

            for (const appId of applicationIds) {
                // Check if already assigned
                const existing = await tx.applicationAssignment.findUnique({
                    where: { applicationId: appId }
                })

                if (!existing) {
                    await tx.applicationAssignment.create({
                        data: {
                            applicationId: appId,
                            assignedToId: memberId,
                            assignedById: user.id,
                            status: 'ACTIVE'
                        }
                    })

                    await tx.application.update({
                        where: { id: appId },
                        data: {
                            supportStatus: 'ASSIGNED',
                            assignedAt: new Date()
                        }
                    })

                    // Optional: Create system message (omitted for bulk performance, or batched)

                    // Create notification
                    await tx.notification.create({
                        data: {
                            userId: memberId,
                            title: 'New Application Assigned',
                            message: `You have been assigned application #${appId}.`,
                            type: 'ASSIGNMENT',
                            priority: 'NORMAL',
                            actionUrl: `/admin/support-member/applications/${appId}`
                        }
                    })

                    successCount++;
                }
            }
            return successCount;
        })

        return NextResponse.json({ success: true, count })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to bulk assign' }, { status: 500 })
    }
}
