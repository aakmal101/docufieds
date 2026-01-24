import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET() {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const members = await prisma.supportTeamMember.findMany({
            include: {
                assignedApplications: {
                    include: {
                        application: {
                            select: {
                                id: true,
                                country: true,
                                supportStatus: true,
                                assignedAt: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: { where: { createdAt: { gte: today } } },
                        documentRequests: { where: { requestedAt: { gte: today } } }
                    }
                }
            },
            orderBy: { fullName: 'asc' }
        })

        // Calculate metrics
        const workload = members.map(m => {
            // Filter completion counts
            // Note: m.assignedApplications contains both active (from previous include if we didn't override, wait, duplicate keys in include?)
            // Prisma allows multiple relations. 
            // Let's fix the query structure above: we can't include 'assignedApplications' twice with different where clauses easily in the same object key unless using select tricks.
            // Better strategy: fetch all assignments and filter in code.

            const active = m.assignedApplications.filter((a: any) => a.status === 'ACTIVE')
            const completed = m.assignedApplications.filter((a: any) => a.status === 'COMPLETED' && a.completedAt)

            const completedToday = completed.filter((a: any) => new Date(a.completedAt) >= today).length
            const completedWeek = completed.filter((a: any) => new Date(a.completedAt) >= startOfWeek).length
            const completedMonth = completed.filter((a: any) => new Date(a.completedAt) >= startOfMonth).length

            // Avg processing time (all time)
            let avgProcessingTime = 'N/A'
            if (completed.length > 0) {
                const totalMs = completed.reduce((acc: number, curr: any) => {
                    return acc + (new Date(curr.completedAt).getTime() - new Date(curr.assignedAt).getTime())
                }, 0)
                const avgMs = totalMs / completed.length
                const avgHours = Math.round(avgMs / (1000 * 60 * 60))
                avgProcessingTime = `${avgHours}h`
            }

            return {
                id: m.id,
                fullName: m.fullName,
                email: m.email,
                photoUrl: m.photoUrl,
                isActive: m.isActive,
                activeCount: active.length,
                completedToday,
                completedWeek,
                completedMonth,
                avgProcessingTime,
                currentAssignments: active.map((a: any) => ({
                    id: a.application.id,
                    country: a.application.country,
                    status: a.application.supportStatus,
                    assignedAt: a.application.assignedAt,
                }))
            }
        })

        return NextResponse.json(workload)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch workload' }, { status: 500 })
    }
}
