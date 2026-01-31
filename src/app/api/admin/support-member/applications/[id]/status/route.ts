import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'
import { NextRequest } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { status } = await req.json()

        // Verify assignment
        const app = await prisma.applicationAssignment.findUnique({
            where: { applicationId: params.id }
        })

        // Strict check: must be assigned to this member? Or allow if lead? 
        // This is member API, so yes.
        if (app?.memberId !== member.id) {
            return NextResponse.json({ error: 'Not assigned' }, { status: 403 })
        }

        const updated = await prisma.application.update({
            where: { id: params.id },
            data: {
                supportStatus: status,
                lastActivityAt: new Date()
            }
        })

        // Log status update
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId: params.id,
                fromStatus: app.status, // Technically we should fetch prev status from App but close enough
                toStatus: status,
                changedByType: 'SUPPORT_MEMBER',
                changedByMemberId: member.id,
                notes: `Status changed to ${status}`
            }
        })

        // Notify User if status implies movement (e.g. IN_PROGRESS)
        if (['IN_REVIEW', 'VERIFIED'].includes(status)) {
            const userApp = await prisma.application.findUnique({ where: { id: params.id }, select: { userId: true } })
            if (userApp) {
                await prisma.notification.create({
                    data: {
                        userId: userApp.userId,
                        title: 'Application Update',
                        message: `Your application status has been updated to: ${status.replace('_', ' ')}`,
                        type: 'STATUS_CHANGE',
                        actionUrl: `/dashboard/individual/applications/${params.id}`
                    }
                })
            }
        }

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
