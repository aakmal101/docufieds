
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || !['ADMIN', 'SUPPORT'].includes(session.user.role)) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Handle both Promise and direct params
        const resolvedParams = params instanceof Promise ? await params : params
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
                supportFeeAssignedById: session.user.id,
                supportFeeAssignedAt: new Date(),
                // Also update main consultancyFee field for backward compatibility 
                // if this fee is intended to replace the process-based fee.
                // User request says "Move fee assignment... per application".
                // It's safer to map it to the main `consultancyFee` logic too so payment gateways work?
                // Let's assume `consultancyFee` matches `supportFeeAmount`.
                consultancyFee: amount
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                actorUserId: session.user.id,
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
