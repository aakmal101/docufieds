import { prisma } from '@/lib/prisma'

/**
 * Auto-assign an application to a support team member.
 * Uses the normalized User model with role === 'SUPPORT' and SupportProfile.
 * The old SupportTeamMember model has been removed.
 */
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

    // 2. Get Active Support Users (replacing old SupportTeamMember query)
    // Query Users with role SUPPORT who have an active SupportProfile
    const supportUsers = await prisma.user.findMany({
        where: {
            role: 'SUPPORT',
            status: 'ACTIVE',
            supportProfile: { isNot: null },
        },
        include: {
            supportProfile: true,
            assignedApplications: {
                where: { status: 'ACTIVE' }
            }
        }
    })

    if (supportUsers.length === 0) {
        console.log(`[AutoAssign] No active SUPPORT users found`)
        return null
    }

    // 3. Filter by Capacity
    const eligibleMembers = supportUsers.filter(m => m.assignedApplications.length < config.maxActivePerMember)

    if (eligibleMembers.length === 0) {
        console.log(`[AutoAssign] All support members at capacity`)
        return null
    }

    let selectedUserId: string | null = null

    // 4. Select Member based on Mode
    if (config.assignmentMode === 'LEAST_LOADED') {
        // Sort by active count ASC
        eligibleMembers.sort((a, b) => a.assignedApplications.length - b.assignedApplications.length)
        selectedUserId = eligibleMembers[0].id
    } else {
        // ROUND_ROBIN — Least Recently Assigned proxy
        const membersWithLastAssign = await Promise.all(eligibleMembers.map(async (m) => {
            const lastAssign = await prisma.applicationAssignment.findFirst({
                where: { assignedToId: m.id },
                orderBy: { assignedAt: 'desc' },
                select: { assignedAt: true }
            })
            return { ...m, lastAssignedAt: lastAssign?.assignedAt ? new Date(lastAssign.assignedAt).getTime() : 0 }
        }))

        // Sort by lastAssignedAt ASC (0 first = never assigned)
        membersWithLastAssign.sort((a, b) => a.lastAssignedAt - b.lastAssignedAt)
        selectedUserId = membersWithLastAssign[0].id
    }

    if (!selectedUserId) return null

    // 5. Create Assignment (using assignedToId/assignedById per normalized schema)
    const assignment = await prisma.applicationAssignment.create({
        data: {
            applicationId,
            assignedToId: selectedUserId,
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
            supportStatus: 'Under Review',
            assignedAt: new Date()
        }
    })

    // 7. Update SupportProfile active ticket count
    await prisma.supportProfile.updateMany({
        where: { userId: selectedUserId },
        data: { activeTicketsCount: { increment: 1 } }
    })

    console.log(`[AutoAssign] Assigned app ${applicationId} to user ${selectedUserId}`)
    return assignment
}
