import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET() {
    const session = await requireSupportLead()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const pendingAssignment = await prisma.application.count({
            where: { supportStatus: 'PENDING_ASSIGNMENT', status: { not: 'DRAFT' } }
        })

        const activeProcessing = await prisma.applicationAssignment.count({
            where: { status: 'ACTIVE' }
        })

        const escalations = await prisma.escalation.count({
            where: { status: 'PENDING' }
        })

        const pendingRejections = await prisma.rejectionRequest.count({
            where: { status: 'PENDING' }
        })

        // Completed today (forwarded to legal today)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const completedToday = await prisma.application.count({
            where: {
                forwardedToLegalAt: {
                    gte: today
                }
            }
        })

        // Avg Processing Time Calculation (Simplified for now)
        // In a real app we'd do aggregation on completed assignments
        const assignments = await prisma.applicationAssignment.findMany({
            where: {
                status: 'COMPLETED',
                completedAt: { not: null }
            },
            select: {
                assignedAt: true,
                completedAt: true
            },
            take: 100 // Sample size
        })

        let avgProcessingTime = 'N/A'
        if (assignments.length > 0) {
            const totalMs = assignments.reduce((acc: number, curr: any) => {
                return acc + (new Date(curr.completedAt).getTime() - new Date(curr.assignedAt).getTime())
            }, 0)
            const avgMs = totalMs / assignments.length
            const avgHours = Math.round(avgMs / (1000 * 60 * 60))
            avgProcessingTime = `${avgHours}h`
        }

        return NextResponse.json({
            pendingAssignment,
            activeProcessing,
            escalations,
            pendingRejections,
            completedToday,
            avgProcessingTime,
            teamCapacity: '85%' // Mock for now
        })

    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
