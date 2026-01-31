import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPPORT', 'SUPPORT_LEAD'].includes(session.user?.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        // Log the action
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'CURRENT',
                toStatus: 'PAYMENT_RECORDED',
                changedByType: session.user.role || 'SUPPORT',
                changedById: session.user.id,
                notes: `Manual payment of ${amount} recorded and verified. ${notes ? `Notes: ${notes}` : ''}`
            }
        })

        return NextResponse.json({ success: true, payment })

    } catch (error) {
        console.error('Create Payment Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
