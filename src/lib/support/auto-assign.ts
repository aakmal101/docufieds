import { prisma } from '@/lib/prisma'

export async function autoAssignApplication(applicationId: string, leadId: string) {
    // 1. Get Config
    const config = await prisma.autoAssignmentConfig.findFirst({
        where: { createdById: leadId },
    })

    // If no config or disabled, skip
    if (!config || !config.isEnabled) {
        console.log(`[AutoAssign] Skipped for app ${applicationId}: Lead ${leadId} has disabled auto-assign or no config.`)
        return null
    }

    // 2. Get Active Team Members
    // We need members who report to this lead and are active
    const members = await prisma.supportTeamMember.findMany({
        where: {
            leadId: leadId,
            isActive: true,
        },
        include: {
            assignedApplications: {
                where: { status: 'ACTIVE' }
            }
        }
    })

    if (members.length === 0) {
        console.log(`[AutoAssign] No active members found for lead ${leadId}`)
        return null
    }

    // 3. Filter by Capacity
    const eligibleMembers = members.filter(m => m.assignedApplications.length < config.maxActivePerMember)

    if (eligibleMembers.length === 0) {
        console.log(`[AutoAssign] All members at capacity for lead ${leadId}`)
        return null
    }

    let selectedMemberId: string | null = null

    // 4. Select Member based on Mode
    if (config.assignmentMode === 'LEAST_LOADED') {
        // Sort by active count ASC
        eligibleMembers.sort((a, b) => a.assignedApplications.length - b.assignedApplications.length)
        selectedMemberId = eligibleMembers[0].id
    } else {
        // ROUND_ROBIN
        // We need to know who was last assigned. 
        // Simplified Round Robin: Find member with oldest 'last assignment' or just random if no history tracked efficiently?
        // Better strategy for RR without dedicated pointer table: 
        // Sort by 'most recent assignment date' ASC (assign to the one who hasn't had one in longest time)

        // Let's get the most recent assignment for each member to determine implied rotation
        // Actually, standard RR usually rotates strictly. "Least Recently Assigned" is a good proxy for stateless RR.

        const membersWithLastAssign = await Promise.all(eligibleMembers.map(async (m) => {
            const lastAssign = await prisma.applicationAssignment.findFirst({
                where: { memberId: m.id },
                orderBy: { assignedAt: 'desc' },
                select: { assignedAt: true }
            })
            return { ...m, lastAssignedAt: lastAssign?.assignedAt ? new Date(lastAssign.assignedAt).getTime() : 0 }
        }))

        // Sort by lastAssignedAt ASC (0 first = never assigned)
        membersWithLastAssign.sort((a, b) => a.lastAssignedAt - b.lastAssignedAt)
        selectedMemberId = membersWithLastAssign[0].id
    }

    if (!selectedMemberId) return null

    // 5. Create Assignment
    const assignment = await prisma.applicationAssignment.create({
        data: {
            applicationId,
            memberId: selectedMemberId,
            assignedById: leadId, // System assigned on behalf of lead
            assignmentType: 'AUTO',
            status: 'ACTIVE',
            notes: `Auto-assigned via ${config.assignmentMode}`
        }
    })

    // 6. Update Application Status
    await prisma.application.update({
        where: { id: applicationId },
        data: {
            supportStatus: 'Under Review', // Or 'ASSIGNED'
            memberId: selectedMemberId,
            assignedAt: new Date()
        }
    })

    // 7. Notification (Optional)
    // Notify member

    console.log(`[AutoAssign] Assigned app ${applicationId} to member ${selectedMemberId}`)
    return assignment
}
