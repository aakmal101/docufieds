import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = await requireSupportLead()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const members = await prisma.user.findMany({
            where: {
                role: 'SUPPORT'
            },
            include: {
                individualProfile: true,
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
                        sentMessages: { where: { createdAt: { gte: today } } },
                        documentRequests: { where: { requestedAt: { gte: today } } }
                    }
                }
            }
        })

        // Calculate metrics
        const workload = members.map((m: any) => {
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
                fullName: m.individualProfile ? `${m.individualProfile.firstName} ${m.individualProfile.lastName || ''}`.trim() : 'Support Member',
                email: m.email,
                photoUrl: m.individualProfile?.photoUrl || m.photoUrl,
                isActive: m.status === 'ACTIVE' || m.status === 'APPROVED',
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

        workload.sort((a, b) => a.fullName.localeCompare(b.fullName))

        return NextResponse.json(workload)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch workload' }, { status: 500 })
    }
}
