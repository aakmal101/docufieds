import { prisma } from '@/lib/prisma'

/**
 * Shared server helper: verifies an agent has access to a specific application.
 * Used by ALL agent endpoints to enforce RBAC.
 * 
 * Checks AgentAssignment where:
 *   agentUserId matches AND (applicationId matches OR targetUser has the application) AND status=ACTIVE
 * 
 * @returns The matching assignment, or null if no access
 */
export async function requireAgentAccess(applicationId: string, agentUserId: string) {
    const assignment = await (prisma as any).agentAssignment.findFirst({
        where: {
            agentUserId,
            status: 'ACTIVE',
            OR: [
                { applicationId },
                {
                    targetUser: {
                        applications: {
                            some: { id: applicationId }
                        }
                    }
                }
            ]
        }
    })

    return assignment
}

/**
 * Checks agent access and throws a structured error if denied.
 * Use this in API routes for clean error handling.
 */
export async function assertAgentAccess(applicationId: string, agentUserId: string) {
    const assignment = await requireAgentAccess(applicationId, agentUserId)
    if (!assignment) {
        const error: any = new Error('Forbidden: Application not assigned to this agent')
        error.status = 403
        throw error
    }
    return assignment
}
