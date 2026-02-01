import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Overview Stats
        const totalAssignments = await prisma.applicationAssignment.count({
            where: { memberId: member.id }
        })

        const activeAssignments = await prisma.applicationAssignment.count({
            where: {
                memberId: member.id,
                status: 'ACTIVE'
            }
        })

        const completedAssignments = await prisma.applicationAssignment.count({
            where: {
                memberId: member.id,
                status: 'COMPLETED'
            }
        })

        // Completion Rate
        const completionRate = totalAssignments > 0
            ? Math.round((completedAssignments / totalAssignments) * 100)
            : 0

        // 2. Weekly Activity (Last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentCompleted = await prisma.applicationAssignment.findMany({
            where: {
                memberId: member.id,
                status: 'COMPLETED',
                completedAt: {
                    gte: sevenDaysAgo
                }
            },
            select: { completedAt: true }
        })

        // Group by day
        const activityMap = new Map<string, number>()
        for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            activityMap.set(dateStr, 0)
        }

        recentCompleted.forEach(a => {
            if (a.completedAt) {
                const dateStr = a.completedAt.toISOString().split('T')[0]
                if (activityMap.has(dateStr)) {
                    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
                }
            }
        })

        const weeklyActivity = Array.from(activityMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
            // Format date for chart (e.g., "Mon", "Jan 01")
            .map(item => ({
                name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
                value: item.count
            }))

        // 3. Status Distribution
        const assignments = await prisma.applicationAssignment.findMany({
            where: { memberId: member.id },
            include: { application: { select: { supportStatus: true } } }
        })

        const statusMap = new Map<string, number>()
        assignments.forEach(a => {
            const status = a.application.supportStatus || 'Unknown'
            statusMap.set(status, (statusMap.get(status) || 0) + 1)
        })

        const statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({
            name,
            value
        }))

        return NextResponse.json({
            overview: {
                total: totalAssignments,
                active: activeAssignments,
                completed: completedAssignments,
                rate: completionRate
            },
            weeklyActivity,
            statusDistribution
        })

    } catch (error) {
        console.error('Performance stats error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
