import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { leadNotes } = await req.json()

        await prisma.$transaction(async (tx) => {
            const request = await tx.rejectionRequest.update({
                where: { id: params.id },
                data: {
                    status: 'APPROVED',
                    reviewedById: session.user.id,
                    leadNotes,
                    reviewedAt: new Date()
                },
                include: { application: true }
            })

            // Update App
            await tx.application.update({
                where: { id: request.applicationId },
                data: {
                    status: 'DECLINED', // Official user status
                    supportStatus: 'REJECTED'
                }
            })

            // Notify User
            await tx.notification.create({ // Assuming Notification model exists
                data: {
                    userId: request.application.userId,
                    title: 'Application Update',
                    message: 'Your application has been declined. Please check details.',
                    type: 'APPLICATION_STATUS',
                    priority: 'HIGH'
                }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
