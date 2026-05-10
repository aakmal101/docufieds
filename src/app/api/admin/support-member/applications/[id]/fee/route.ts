
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getCurrentUser()

        if (!user?.id || !['ADMIN', 'SUPPORT'].includes(user!.role)) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Handle both Promise and direct params
        const resolvedParams = await params
        const applicationId = resolvedParams.id

        const body = await request.json()
        const { amount, currency, notes } = body

        if (amount === undefined || amount === null || typeof amount !== 'number' || amount < 0) {
            return NextResponse.json(
                { success: false, message: 'Valid fee amount is required' },
                { status: 400 }
            )
        }

        // Update application
        const application = await prisma.application.update({
            where: { id: applicationId },
            data: {
                supportFeeAmount: amount,
                supportFeeCurrency: currency || 'BDT',
                supportFeeDescription: notes,
                supportFeeAssignedById: user!.id,
                supportFeeAssignedAt: new Date(),
                // Also update main consultancyFee field for backward compatibility 
                consultancyFee: amount
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                actorUserId: user!.id,
                targetUserId: application.userId,
                action: 'APPLICATION_FEE_ASSIGNED',
                metadata: {
                    applicationId,
                    amount,
                    currency: currency || 'BDT',
                    notes
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Fee assigned successfully',
            data: application
        })

    } catch (error: any) {
        console.error('Error assigning fee:', error)
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
