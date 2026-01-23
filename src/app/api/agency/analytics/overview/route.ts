import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/analytics/overview?period=thisMonth|lastMonth|last3Months|custom&startDate=&endDate=
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
        const period = searchParams.get('period') || 'thisMonth'

        // Calculate date range based on period
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
            case 'custom':
                startDate = new Date(searchParams.get('startDate') || '')
                endDate = new Date(searchParams.get('endDate') || '')
                break
            default:
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        }

        // Get applications in period
        const applications = await prisma.application.findMany({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                payments: {
                    select: {
                        amount: true,
                        status: true,
                    },
                },
            },
        })

        // Get payments in period
        const payments = await prisma.payment.findMany({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Calculate metrics
        const totalApplications = applications.length
        const completedApplications = applications.filter(a => a.status === 'COMPLETED').length
        const successRate = totalApplications > 0 ? (completedApplications / totalApplications) * 100 : 0

        const totalRevenue = payments
            .filter(p => p.status === 'PAID')
            .reduce((sum, p) => sum + p.amount, 0)

        const pendingPayments = payments
            .filter(p => p.status === 'PENDING' || p.status === 'PARTIAL')
            .reduce((sum, p) => sum + p.amount, 0)

        return NextResponse.json({
            success: true,
            data: {
                period: {
                    start: startDate,
                    end: endDate,
                },
                metrics: {
                    totalApplications,
                    completedApplications,
                    successRate: Math.round(successRate * 10) / 10,
                    totalRevenue,
                    pendingPayments,
                },
            },
        })
    } catch (error) {
        console.error('Error fetching analytics overview:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
