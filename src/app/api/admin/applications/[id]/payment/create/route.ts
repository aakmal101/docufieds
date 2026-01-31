import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    console.log('Payment Create Session:', {
        user: session?.user?.email,
        role: session?.user?.role,
        id: session?.user?.id
    })

    // Check for SUPPORT, SUPPORT_LEAD, or SUPPORT_MEMBER 
    // ALSO allowing 'ADMIN' just in case you are testing as admin
    if (!session || !['SUPPORT', 'SUPPORT_LEAD', 'SUPPORT_MEMBER', 'ADMIN'].includes(session.user?.role || '')) {
        console.log('Unauthorized Access Attempt - Role Mismatch:', session?.user?.role)
        return NextResponse.json({ error: `Unauthorized. Role: ${session?.user?.role}` }, { status: 401 })
    }

    try {
        const applicationId = params.id
        const { amount, currency, method, transactionId, notes } = await req.json()

        if (!amount || !method) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get application to link user
        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        })

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Create Payment Record (Automatically Verified since created by Support)
        const payment = await prisma.payment.create({
            data: {
                applicationId,
                userId: app.userId,
                amount: parseFloat(amount),
                status: 'VERIFIED', // Auto-verify
                method,
                transactionId,
                paidAt: new Date(),
                description: 'Manual payment recorded by support'
            }
        })

        // Update Application Status to reflect payment success
        await prisma.application.update({
            where: { id: applicationId },
            data: {
                supportStatus: 'VERIFIED',
                lastActivityAt: new Date()
            }
        })

        // Log the action
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'PENDING_PAYMENT',
                toStatus: 'PAYMENT_VERIFIED',
                changedByType: session.user.role || 'SUPPORT',
                changedById: session.user.id,
                notes: `Manual payment of ${amount} ${currency || 'BDT'} recorded and verified. ${notes ? `Notes: ${notes}` : ''}`
            }
        })

        // Create Notification for User
        await prisma.notification.create({
            data: {
                userId: app.userId,
                title: 'Payment Verified',
                message: `Your payment of ${amount} ${currency || 'BDT'} has been manually verified by support.`,
                type: 'PAYMENT_VERIFIED',
                actionUrl: `/dashboard/individual/applications/${applicationId}`
            }
        })

        return NextResponse.json({ success: true, payment })

    } catch (error: any) {
        console.error('Create Payment Error:', error)
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.meta || error
        }, { status: 500 })
    }
}
