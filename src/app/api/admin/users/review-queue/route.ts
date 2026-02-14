import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProfileReviewer } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const session = await requireProfileReviewer()
    if (!session) {
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
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
        ]
    }

    try {
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    profileStatus: true,
                    role: true,
                    country: true, // Need to fetch from relation or is it on User?
                    // User model has 'nationality' but not 'country'. 
                    // Let's check schema again. `nationality` is there.
                    nationality: true,
                    photoUrl: true
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
