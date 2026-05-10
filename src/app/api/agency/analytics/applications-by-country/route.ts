import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/analytics/applications-by-country?period=thisMonth
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
        const period = searchParams.get('period') || 'thisMonth'

        let startDate: Date
        let endDate: Date = new Date()

        switch (period) {
            case 'thisMonth':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
                break
            case 'lastMonth':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
                endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0)
                break
            case 'last3Months':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1)
                break
            default:
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        }

        const applications = await prisma.application.groupBy({
            by: ['country'],
            where: {
                userId: user!.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _count: {
                id: true,
            },
        })

        const data = applications.map(item => ({
            name: item.country,
            value: item._count.id,
        }))

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error('Error fetching applications by country:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch data' },
            { status: 500 }
        )
    }
}
