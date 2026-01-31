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
    const statusFilter = searchParams.get('status') || 'ALL' // PENDING, PROCESSING, COMPLETED, REJECTED, ALL

    try {
        const whereClause: any = {
            status: { not: 'DRAFT' } // Never show drafts to lead?
        }

        // Status Logic
        switch (statusFilter) {
            case 'PENDING':
                whereClause.supportStatus = 'PENDING_ASSIGNMENT'
                break;
            case 'PROCESSING':
                // Active processing means assigned but not finished
                whereClause.supportStatus = { notIn: ['PENDING_ASSIGNMENT', 'VERIFIED_COMPLETE'] } // Adjust based on your enum
                whereClause.status = { notIn: ['COMPLETED', 'DECLINED', 'DRAFT'] }
                break;
            case 'ESCALATED':
                // This might need a join or separate check if normalized, but let's assume supportStatus 'ESCALATED' exists in your schema?
                // Actually the dashboard uses `prisma.escalation.count`.
                // For this list, we might want applications that HAVE an active escalation.
                whereClause.escalations = { some: { status: 'PENDING' } }
                break;
            case 'REJECTED':
                whereClause.status = 'DECLINED'
                break;
            case 'COMPLETED':
                whereClause.status = 'COMPLETED'
                break;

            // For specific granular statuses if needed
            default:
                if (statusFilter !== 'ALL') {
                    // Try to match specific status if passed
                    whereClause.OR = [
                        { status: statusFilter },
                        { supportStatus: statusFilter }
                    ]
                }
                break;
        }

        // Search Logic
        if (search) {
            whereClause.title_or_user_contains = {
                OR: [
                    { id: { contains: search, mode: 'insensitive' } },
                    { user: { fullName: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            }
            // Prisma doesn't support 'title_or_user_contains' alias directly this way in top level content
            delete whereClause.title_or_user_contains
            whereClause.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ]
        }

        if (country !== 'ALL') whereClause.country = country

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: whereClause,
                include: {
                    user: { select: { fullName: true, email: true } },
                    _count: { select: { documents: true } },
                    payments: {
                        select: { status: true, amount: true, currency: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    assignment: {
                        include: {
                            member: { select: { user: { select: { fullName: true } } } }
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.application.count({ where: whereClause })
        ])

        return NextResponse.json({ applications, total, pages: Math.ceil(total / limit) })
    } catch (error) {
        console.error('Fetch Apps Error:', error)
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }
}
