import { prisma } from '@/lib/prisma'
import { autoAssignApplication } from './auto-assign'

export async function triggerAutoAssign(applicationId: string) {
    try {
        console.log(`[AutoAssign] Triggered for application ${applicationId}`)

        // 1. Determine which Lead should handle this.
        // Logic: If we have multiple leads, we might assign based on Country or Process Type.
        // For now, we assume a SINGLE Support Lead model or just pick the first one/default.
        // Or, we check if there is a default config. 
        // Task requirement: "Find the application's relevant lead... For now, assume single lead - get the one SUPPORT_LEAD user"

        const lead = await prisma.user.findFirst({
            where: { role: 'SUPPORT_LEAD' }
        })

        if (!lead) {
            console.log('[AutoAssign] No SUPPORT_LEAD found to attribute assignment configuration.')
            return
        }

        // 2. Call Logic
        const assignment = await autoAssignApplication(applicationId, lead.id)

        if (assignment) {
            console.log('[AutoAssign] Success.')
        } else {
            console.log('[AutoAssign] No assignment made (disabled or capacity full).')
        }

    } catch (error) {
        console.error('[AutoAssign] Error:', error)
    }
}
