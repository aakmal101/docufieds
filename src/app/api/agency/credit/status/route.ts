import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'

export const dynamic = 'force-dynamic'

// GET /api/agency/credit/status
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user || user.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const creditLimit = user.agencyProfile?.creditLimit || 0
        const outstandingAmount = user.agencyProfile?.outstandingAmount || 0
        const availableCredit = creditLimit - outstandingAmount
        const creditUsagePercent = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0

        const documentLimit = user.documentLimit || 10
        const documentsUsed = user.documentsUsed || 0
        const documentsRemaining = documentLimit - documentsUsed
        const documentUsagePercent = (documentsUsed / documentLimit) * 100

        // Calculate days until payment due
        let daysUntilDue = null
        if (user.nextPaymentDue) {
            const dueDate = new Date(user.nextPaymentDue)
            const today = new Date()
            const diffTime = dueDate.getTime() - today.getTime()
            daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }

        return NextResponse.json({
            success: true,
            data: {
                creditLimit,
                outstandingAmount,
                availableCredit,
                creditUsagePercent,
                documentLimit,
                documentsUsed,
                documentsRemaining,
                documentUsagePercent,
                nextPaymentDue: user.nextPaymentDue,
                daysUntilDue,
                isLocked: documentsUsed >= documentLimit,
                needsAttention: creditUsagePercent > 80 || documentUsagePercent > 80 || (daysUntilDue !== null && daysUntilDue <= 3),
            },
        })
    } catch (error) {
        console.error('Error fetching credit status:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch credit status' },
            { status: 500 }
        )
    }
}
