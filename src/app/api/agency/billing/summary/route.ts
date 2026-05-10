import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/billing/summary
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user?.id || user!.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get payment summary
        const payments = await prisma.payment.findMany({
            where: { userId: user!.id },
            select: {
                amount: true,
                status: true,
                dueDate: true,
            },
        })

        const totalPaid = payments
            .filter(p => p.status === 'PAID')
            .reduce((sum, p) => sum + p.amount, 0)

        const totalOutstanding = payments
            .filter(p => p.status === 'PENDING' || p.status === 'PARTIAL')
            .reduce((sum, p) => sum + p.amount, 0)

        const overduePayments = payments.filter(
            p => (p.status === 'PENDING' || p.status === 'PARTIAL') &&
                p.dueDate &&
                new Date(p.dueDate) < new Date()
        )

        const nextPayment = payments
            .filter(p => p.status === 'PENDING' && p.dueDate)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]

        return NextResponse.json({
            success: true,
            data: {
                totalPaid,
                totalOutstanding,
                overdueCount: overduePayments.length,
                overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
                nextPaymentDue: nextPayment?.dueDate || null,
                nextPaymentAmount: nextPayment?.amount || 0,
            },
        })
    } catch (error) {
        console.error('Error fetching billing summary:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch summary' },
            { status: 500 }
        )
    }
}
