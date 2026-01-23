import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/analytics/monthly-trend?months=6
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const months = parseInt(searchParams.get('months') || '6')

        const endDate = new Date()
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months, 1)

        const applications = await prisma.application.findMany({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                createdAt: true,
            },
        })

        const monthlyData: { [key: string]: number } = {}

        applications.forEach(app => {
            const monthKey = new Date(app.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            })
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
        })

        const data = Object.entries(monthlyData)
            .map(([month, count]) => ({ month, applications: count }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error('Error fetching monthly trend:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch data' },
            { status: 500 }
        )
    }
}
