import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET(req: Request) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    try {
        const escalations = await prisma.escalation.findMany({
            where: {
                ...(status && status !== 'ALL' ? { status } : {}),
                // Ideally filter by lead's team if support is partitioned, assuming full access for now
            },
            include: {
                application: {
                    select: { id: true, country: true, processType: true, supportStatus: true }
                },
                escalatedBy: {
                    select: { id: true, photoUrl: true, individualProfile: { select: { firstName: true, lastName: true } } }
                }
            },
            orderBy: [
                { priority: 'desc' }, // URGENT > HIGH > NORMAL
                { escalatedAt: 'asc' } // Oldest first
            ]
        })

        return NextResponse.json(escalations)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch escalations' }, { status: 500 })
    }
}
