import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET(req: Request) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || 'ALL'
    const processType = searchParams.get('processType') || 'ALL'

    try {
        const whereClause: any = {
            supportStatus: 'PENDING_ASSIGNMENT',
            status: { notIn: ['DRAFT', 'CANCELLED'] },
        }

        if (search) {
            whereClause.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
            ]
        }

        if (country !== 'ALL') whereClause.country = country
        if (processType !== 'ALL') whereClause.processType = processType

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: whereClause,
                include: {
                    user: { select: { fullName: true, email: true } },
                    _count: { select: { documents: true } },
                    payments: {
                        select: { status: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.application.count({ where: whereClause })
        ])

        return NextResponse.json({ applications, total, pages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch incoming applications' }, { status: 500 })
    }
}
