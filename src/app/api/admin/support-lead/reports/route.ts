import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const session = await requireSupportLead()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'

    // Calculate start date based on range
    const now = new Date()
    let startDate = new Date()
    if (range === '7d') startDate.setDate(now.getDate() - 7)
    else if (range === '30d') startDate.setDate(now.getDate() - 30)
    else if (range === '90d') startDate.setDate(now.getDate() - 90)
    else startDate = new Date(0) // All time

    try {
        // 1. Fetch filtered applications (submitted within range)
        const apps = await prisma.application.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { not: 'DRAFT' } // Only submitted
            },
            select: {
                id: true,
                status: true,
                supportStatus: true,
                createdAt: true,
                assignedAt: true,
                // We'll use this for processing time if we have a 'completedAt' field or equivalent status change logic
                // For now, let's use updatedAt if status is final
                updatedAt: true,
                forwardedToLegalAt: true
            }
        })

        // 2. Fetch team performance
        const members = await prisma.supportTeamMember.findMany({
            include: {
                _count: {
                    select: {
                        assignedApplications: {
                            where: { assignedAt: { gte: startDate } }
                        }
                    }
                },
                assignedApplications: {
                    where: { assignedAt: { gte: startDate } },
                    select: {
                        status: true,
                        assignedAt: true,
                        applicationId: true // Just to count
                    }
                }
            }
        })

        // --- CALCULATE STATS ---

        const totalProcessed = apps.length
        const approvedCount = apps.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status) || a.supportStatus === 'FORWARDED_TO_LEGAL').length
        const rejectedCount = apps.filter(a => ['REJECTED', 'DECLINED'].includes(a.status) || a.supportStatus === 'REJECTED').length

        const pendingCount = totalProcessed - approvedCount - rejectedCount

        const approvalRate = totalProcessed > 0 ? Math.round((approvedCount / totalProcessed) * 100) : 0
        const rejectionRate = totalProcessed > 0 ? Math.round((rejectedCount / totalProcessed) * 100) : 0

        // Avg Processing Time (Mocked logic mostly as we don't strictly track 'completedAt' in schema perfectly yet)
        // We'll calculate it based on (updatedAt - assignedAt) for completed apps
        let totalTimeMs = 0
        let timeCount = 0

        apps.forEach(app => {
            // Determine end time: Verification/Forwarding time is more accurate than generic update
            const completionTime = app.supportStatus === 'FORWARDED_TO_LEGAL'
                ? (app as any).forwardedToLegalAt
                : app.updatedAt

            if (['APPROVED', 'COMPLETED'].includes(app.status) || app.supportStatus === 'FORWARDED_TO_LEGAL') {
                if (app.assignedAt && completionTime) {
                    const end = new Date(completionTime).getTime()
                    const start = new Date(app.assignedAt).getTime()
                    const diff = end - start
                    if (diff > 0) {
                        totalTimeMs += diff
                        timeCount++
                    }
                }
            }
        })

        const avgProcessingTimeHours = timeCount > 0 ? Math.round((totalTimeMs / timeCount) / (1000 * 60 * 60)) : 0

        // Team Table Data
        const teamStats = members.map(m => {
            const assigned = m._count.assignedApplications
            const active = m.assignedApplications.filter(a => a.status === 'ACTIVE').length
            const completed = m.assignedApplications.filter(a => a.status === 'COMPLETED').length

            return {
                id: m.id,
                name: m.fullName,
                assigned,
                active,
                completed,
                efficiency: assigned > 0 ? Math.round((completed / assigned) * 100) : 0
            }
        })

        // Chart Data (Group by Date)
        // Simple grouping by day for the selected range
        const chartDataArray: any[] = []
        // Fill logic would go here, for now sending raw simple aggregations
        // Let's group `apps` by createdAt (YYYY-MM-DD)
        const groupedByDate: Record<string, number> = {}
        apps.forEach(app => {
            const date = new Date(app.createdAt).toISOString().split('T')[0]
            groupedByDate[date] = (groupedByDate[date] || 0) + 1
        })

        // Sort keys
        Object.keys(groupedByDate).sort().forEach(date => {
            chartDataArray.push({ date, count: groupedByDate[date] })
        })


        return NextResponse.json({
            kpis: {
                totalApplications: totalProcessed,
                approvalRate,
                rejectionRate,
                avgProcessingHours: avgProcessingTimeHours,
                pendingCount
            },
            teamPerformance: teamStats,
            activityChart: chartDataArray
        })

    } catch (error) {
        console.error('Reports API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
    }
}
