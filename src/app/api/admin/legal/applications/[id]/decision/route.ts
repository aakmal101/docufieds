import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'LEGAL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { decision, reason } = await req.json()
        const applicationId = params.id

        if (!['APPROVE', 'REJECT'].includes(decision)) {
            return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
        }

        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        })

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        const newStatus = decision === 'APPROVE' ? 'COMPLETED' : 'DECLINED'
        const notificationTitle = decision === 'APPROVE' ? 'Visa Application Approved' : 'Visa Application Declined'
        const notificationMessage = decision === 'APPROVE'
            ? 'Congratulations! Your visa application has been approved and processed.'
            : `Your visa application has been declined. Reason: ${reason}`

        // Update Application
        await prisma.application.update({
            where: { id: applicationId },
            data: {
                status: newStatus,
                lastActivityAt: new Date()
            }
        })

        // Log Status Change
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'DOCUMENT_UNDER_PROCESSING', // Assuming this is the prev state, or fetch it
                toStatus: newStatus,
                changedByType: 'LEGAL',
                changedById: session.user.id,
                notes: reason || 'Legal decision made.'
            }
        })

        // Notify User
        await prisma.notification.create({
            data: {
                userId: app.userId,
                title: notificationTitle,
                message: notificationMessage,
                type: decision === 'APPROVE' ? 'VISA_ISSUED' : 'APPLICATION_DECLINED',
                actionUrl: `/dashboard/individual/applications/${applicationId}`
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Legal Decision Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
