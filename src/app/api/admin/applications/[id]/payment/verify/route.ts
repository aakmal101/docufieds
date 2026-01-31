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
        const { paymentMethod, notes } = await req.json().catch(() => ({}))
        const applicationId = params.id

        // Find pending payment
        const payment = await prisma.payment.findFirst({
            where: { applicationId }
        })

        if (!payment) {
            return NextResponse.json({ error: 'No payment found for this application' }, { status: 404 })
        }

        // Update payment status
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'VERIFIED',
                paidAt: new Date(),
                method: paymentMethod || payment.method // Update if provided
            }
        })

        // Also update application support status if needed, but 'VERIFIED' status 
        // usually refers to the whole app? Or just payment? 
        // User request: "updating the paymentStatus to "VERIFIED"."
        // We will just update Payment model as requested.

        // Add a system note/status update
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'CURRENT', // Placeholder since we don't track prev payment status in this table easily without query
                toStatus: 'PAYMENT_VERIFIED',
                changedByType: session.user.role || 'SUPPORT',
                changedById: session.user.id,
                notes: `Payment verified manually by support staff. ${notes ? `Note: ${notes}` : ''}`
            }
        })

        return NextResponse.json({ success: true, payment: updatedPayment })

    } catch (error) {
        console.error('Verify Payment Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
