import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLegal } from '@/lib/auth/admin-guard'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await requireLegal()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { action, notes } = await req.json() // action: 'APPROVE' | 'REJECT'

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
        if (!notes) {
            return NextResponse.json({ error: 'Notes are mandatory' }, { status: 400 })
        }

        const applicationId = params.id

        // Define statuses
        const newStatus = action === 'APPROVE' ? 'COMPLETED' : 'REJECTED'
        // 'REJECTED' or 'DECLINED'? Schema comment says `DECLINED` / `REJECTED`. 
        // Admin usually 'DECLINED' or 'REJECTED'. Let's use 'REJECTED' for Legal Rejection to be strong.

        // Update Application
        const app = await prisma.application.update({
            where: { id: applicationId },
            data: {
                status: newStatus,
                // Do we update supportStatus? 
                // Maybe 'LEGAL_COMPLETED' or just leave it?
                // If we leave it 'FORWARDED_TO_LEGAL', we know it went there.
                // If we restrict status filters correctly, app.status takes precedence.
                // Let's update Log.
            }
        })

        // Log Status Update
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'READY_FOR_LEGAL', // Assumption
                toStatus: newStatus,
                changedByType: 'LEGAL',
                changedById: session.user.id,
                notes: notes,
                isVisibleToUser: true // User should know result
            }
        })

        // Notify User?
        // Notification logic usually in a helper or triggers.
        // Let's add simple notification record.
        await prisma.notification.create({
            data: {
                userId: app.userId,
                title: action === 'APPROVE' ? 'Application Completed' : 'Application Rejected',
                message: action === 'APPROVE'
                    ? 'Your application has been finalized by our Legal Team. You can now download your documents.'
                    : `Your application was rejected by Legal. Reason: ${notes}`,
                type: action === 'APPROVE' ? 'SUCCESS' : 'ERROR',
                isRead: false
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[API] Legal Decision Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
