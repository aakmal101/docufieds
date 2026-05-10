import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/applications?page=1&limit=10&status=&country=&search=
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user?.id || user!.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const country = searchParams.get('country')
        const search = searchParams.get('search')
        const processType = searchParams.get('processType')

        // Build where clause
        const where: any = {
            userId: user!.id,
        }

        if (status) where.status = status
        if (country) where.country = country
        if (processType) where.processType = processType
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { memberId: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Get total count
        const total = await prisma.application.count({ where })

        // Get paginated applications
        const applications = await prisma.application.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                documents: {
                    select: {
                        id: true,
                        documentType: true,
                        isRequired: true,
                    },
                },
                statusUpdates: {
                    orderBy: { createdAt: 'desc' }, // Fixed: orderBy createdAt instead of updatedBy/updatedAt if not exist? Schema has createdAt
                    take: 1,
                },
                payments: { // Fixed: Changed 'payment' to 'payments' as per schema (1:N)
                    select: {
                        status: true,
                        amount: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching applications:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch applications' },
            { status: 500 }
        )
    }
}
