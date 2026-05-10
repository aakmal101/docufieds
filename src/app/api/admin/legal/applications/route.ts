import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLegal } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    console.log('[API] Legal Applications List - Request Received');
    const session = await requireLegal()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
    const search = (searchParams.get('search') || '').trim()
    const statusFilter = (searchParams.get('status') || 'ALL').toUpperCase()

    // Base Condition: MUST be forwarded to legal AND not Draft
    const whereConditions: any[] = [
        { supportStatus: 'FORWARDED_TO_LEGAL' },
        { status: { not: 'DRAFT' } }
    ]

    // Status Filter logic tailored for Legal view
    if (statusFilter === 'PENDING') {
        whereConditions.push({ status: { notIn: ['COMPLETED', 'DECLINED', 'REJECTED'] } })
    } else if (statusFilter === 'COMPLETED') {
        whereConditions.push({ status: 'COMPLETED' })
    } else if (statusFilter === 'REJECTED') {
        whereConditions.push({ status: { in: ['DECLINED', 'REJECTED'] } })
    }

    if (search) {
        whereConditions.push({
            OR: [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { individualProfile: { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }] } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ]
        })
    }

    const whereClause = { AND: whereConditions }

    try {
        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: whereClause,
                select: {
                    // EXPLICIT SELECTION - NO PAYMENT DATA
                    id: true,
                    status: true,
                    supportStatus: true,
                    forwardedToLegalAt: true,
                    updatedAt: true,
                    country: true,
                    processType: true,
                    user: {
                        select: {
                            individualProfile: { select: { firstName: true, lastName: true } },
                            email: true
                        }
                    },
                    // Include minimal assignment info if interesting (e.g. who forwarded)
                    // Not strictly needed per prompt ("No assignment logic")
                },
                orderBy: { forwardedToLegalAt: 'desc' }, // Newest forwarded first
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.application.count({ where: whereClause })
        ])

        return NextResponse.json({
            applications,
            total,
            pages: Math.ceil(total / limit)
        })

    } catch (error) {
        console.error('[API] Legal Apps List Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
