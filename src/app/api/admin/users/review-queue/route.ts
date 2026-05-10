import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProfileReviewer } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const user = await requireProfileReviewer()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
    const search = (searchParams.get('search') || '').trim()

    const status = (searchParams.get('status') || 'PENDING_REVIEW')

    const whereClause: any = {}

    // Only map if it's a valid status, otherwise default to all or pending?
    // Let's strict filter or allow 'ALL'.
    if (status !== 'ALL') {
        whereClause.profileStatus = status
    }

    if (search) {
        whereClause['OR'] = [
            { individualProfile: { firstName: { contains: search, mode: 'insensitive' } } },
            { individualProfile: { lastName: { contains: search, mode: 'insensitive' } } },
            { email: { contains: search, mode: 'insensitive' } },
            { individualProfile: { phoneNumber: { contains: search, mode: 'insensitive' } } }
        ]
    }

    try {
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    individualProfile: { select: { firstName: true, lastName: true, phoneNumber: true } },
                    photoUrl: true,
                    email: true,
                    createdAt: true,
                    profileStatus: true,
                    role: true,
                    nationality: true
                },
                orderBy: { createdAt: 'asc' }, // Oldest first for queue
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where: whereClause })
        ])

        return NextResponse.json({
            users,
            total,
            pages: Math.ceil(total / limit)
        })

    } catch (error) {
        console.error('[API] Review Queue Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
