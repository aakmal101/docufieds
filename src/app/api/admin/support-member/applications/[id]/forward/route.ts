import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Validate (omitted strict verification checks for brevity/mock)

        await prisma.application.update({
            where: { id: params.id },
            data: {
                supportStatus: 'FORWARDED_TO_LEGAL',
                status: 'DOCUMENT_UNDER_REVIEW',
                forwardedToLegalAt: new Date(),
                lastActivityAt: new Date()
            }
        })

        // Fetch user ID for notification
        const app = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (app) {
            // Create Notification for User
            await prisma.notification.create({
                data: {
                    userId: app.userId,
                    title: 'Application Forwarded',
                    message: 'Your application has been processed by support and forwarded to the legal team for final review.',
                    type: 'STATUS_CHANGE',
                    actionUrl: `/dashboard/individual/applications/${params.id}`
                }
            })
        }

        // Log Status Update
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId: params.id,
                fromStatus: 'DOCUMENT_UNDER_PROCESSING',
                toStatus: 'DOCUMENT_UNDER_REVIEW',
                changedByType: 'SUPPORT_MEMBER',
                changedByMemberId: member.id,
                notes: 'Forwarded to Legal Team'
            }
        })

        // Mark assignment completed
        await prisma.applicationAssignment.update({
            where: { applicationId: params.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
