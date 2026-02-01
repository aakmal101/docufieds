import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLegal } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await requireLegal()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Stats Logic
        // 1. Pending Legal Review: Support Status is 'FORWARDED_TO_LEGAL' or 'VERIFIED' (if that's used)
        // AND status is NOT yet 'COMPLETED' or 'DECLINED'
        const pendingReview = await prisma.application.count({
            where: {
                supportStatus: 'FORWARDED_TO_LEGAL', // Explicit handoff status
                status: {
                    notIn: ['COMPLETED', 'DECLINED', 'DRAFT', 'REJECTED']
                }
            }
        })

        // 2. Ready to Deliver (Completed by Legal)
        // Legal finishes app by setting status to COMPLETED
        const readyToDeliver = await prisma.application.count({
            where: {
                status: 'COMPLETED',
                // Ideally check if processed by legal? 
                // For now, if status is COMPLETED and supportStatus was legal-related, that's enough
                supportStatus: 'FORWARDED_TO_LEGAL' // Stays as this or updates to something else? 
                // Actually, if legal marks completed, supportStatus might verify 'COMPLETED'
            }
        })

        // 3. Rejected by Legal
        const rejected = await prisma.application.count({
            where: {
                status: { in: ['DECLINED', 'REJECTED'] },
                supportStatus: 'FORWARDED_TO_LEGAL' // Means it reached legal before rejection
            }
        })

        // 4. Avg Processing Time (Legal)
        // From forwardedToLegalAt -> updatedAt (when status became COMPLETED)
        const completedApps = await prisma.application.findMany({
            where: {
                status: 'COMPLETED',
                supportStatus: 'FORWARDED_TO_LEGAL',
                forwardedToLegalAt: { not: null }
            },
            select: {
                forwardedToLegalAt: true,
                updatedAt: true
            },
            take: 100
        })

        let avgProcessingTime = 'N/A'
        if (completedApps.length > 0) {
            const totalMs = completedApps.reduce((acc, curr) => {
                if (!curr.forwardedToLegalAt) return acc
                const start = new Date(curr.forwardedToLegalAt).getTime()
                const end = new Date(curr.updatedAt).getTime()
                return acc + (end - start)
            }, 0)

            const totalHours = totalMs / (1000 * 60 * 60)
            const avgHours = Math.round(totalHours / completedApps.length)
            avgProcessingTime = `${avgHours}h`
        }

        return NextResponse.json({
            pendingReview,
            readyToDeliver,
            rejected,
            avgProcessingTime
        })

    } catch (error) {
        console.error('[API] Legal Dashboard Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
