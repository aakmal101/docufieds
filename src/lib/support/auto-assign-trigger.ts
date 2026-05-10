import { prisma } from '@/lib/prisma'
import { autoAssignApplication } from './auto-assign'

export async function triggerAutoAssign(applicationId: string) {
    try {
        console.log(`[AutoAssign] Triggered for application ${applicationId}`)

        // Find a SUPPORT user who has an AutoAssignmentConfig (acts as lead).
        // The Role enum no longer has SUPPORT_LEAD — we use SUPPORT users
        // with auto-assign configs as the de facto leads.
        const leadWithConfig = await prisma.autoAssignmentConfig.findFirst({
            where: { isEnabled: true },
            include: { createdBy: true },
            orderBy: { createdAt: 'desc' },
        })

        if (!leadWithConfig) {
            console.log('[AutoAssign] No active auto-assignment config found.')
            return
        }

        const leadId = leadWithConfig.createdById

        // 2. Call Logic
        const assignment = await autoAssignApplication(applicationId, leadId)

        if (assignment) {
            console.log('[AutoAssign] Success.')
        } else {
            console.log('[AutoAssign] No assignment made (disabled or capacity full).')
        }

    } catch (error) {
        console.error('[AutoAssign] Error:', error)
    }
}
