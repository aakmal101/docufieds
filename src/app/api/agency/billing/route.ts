import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/billing?startDate=&endDate=&status=&page=1&limit=10
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        // Support Dashboard access will be added here in future
        if (!user?.id || user!.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        // Build where clause
        const where: any = {
            userId: user!.id,
        }

        if (startDate) {
            where.createdAt = { gte: new Date(startDate) }
        }
        if (endDate) {
            where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
        }
        if (status) {
            where.status = status
        }

        // Get total count
        const total = await prisma.payment.count({ where })

        // Get paginated payments
        const payments = await prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                application: {
                    select: {
                        id: true,
                        country: true,
                        processType: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching billing:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch billing history' },
            { status: 500 }
        )
    }
}
