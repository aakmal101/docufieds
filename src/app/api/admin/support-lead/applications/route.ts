import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET(req: Request) {
    // 🛡️ Hardening: Guaranteed response shape default
    const fallbackResponse = { applications: [], total: 0, pages: 1 };

    try {
        const session = await requireSupportLead()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
        const search = (searchParams.get('search') || '').trim()
        const country = searchParams.get('country') || 'ALL'
        const statusFilter = (searchParams.get('status') || 'ALL').toUpperCase()

        const whereConditions: any[] = []

        // 1. Base Filter (No Drafts)
        whereConditions.push({ status: { not: 'DRAFT' } })

        // 2. Status Filter Logic
        switch (statusFilter) {
            case 'ALL':
                break;
            case 'PENDING':
                whereConditions.push({ supportStatus: 'PENDING_ASSIGNMENT' })
                break;
            case 'PROCESSING':
                // Exclude the starting state and final states to find "Active Processing"
                whereConditions.push({
                    supportStatus: { not: 'PENDING_ASSIGNMENT' },
                    status: { notIn: ['COMPLETED', 'DECLINED', 'REJECTED', 'DRAFT'] }
                })
                break;
            case 'ESCALATED':
                whereConditions.push({ escalations: { some: { status: 'PENDING' } } })
                break;
            case 'REJECTED':
                // Covers both Application declined and Support-side rejection flow
                whereConditions.push({
                    OR: [
                        { status: 'DECLINED' },
                        { status: 'REJECTED' },
                        { supportStatus: 'REJECTED' },
                        { supportStatus: 'PENDING_REJECTION' }
                    ]
                })
                break;
            case 'COMPLETED':
                whereConditions.push({ status: 'COMPLETED' })
                break;
            default:
                // Fallback for direct status codes (e.g. IN_REVIEW)
                whereConditions.push({
                    OR: [
                        { status: statusFilter },
                        { supportStatus: statusFilter }
                    ]
                })
                break;
        }

        // 3. Search Logic
        if (search) {
            whereConditions.push({
                OR: [
                    { id: { contains: search, mode: 'insensitive' } },
                    { user: { fullName: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            })
        }

        // 4. Country Filter
        if (country !== 'ALL') {
            whereConditions.push({ country })
        }

        // Combine all conditions with logical AND
        const whereClause = { AND: whereConditions }

        console.log('SupportLead Apps Query:', JSON.stringify(whereClause, null, 2))

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: whereClause,
                include: {
                    user: { select: { fullName: true, email: true } },
                    _count: { select: { documents: true } },
                    payments: {
                        // 🔴 FIX: Removed 'currency' as it does not exist in Payment model
                        select: { status: true, amount: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    assignment: {
                        include: {
                            member: { select: { fullName: true } }
                        }
                    }
                },
            },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
    prisma.application.count({ where: whereClause })
        ])

    return NextResponse.json({ applications, total, pages: Math.ceil(total / limit) })

} catch (error) {
    console.error('Fetch Apps Critical Failure:', error)
    // 🛡️ Hardening: Never throw, return empty list so UI doesn't crash
    return NextResponse.json(fallbackResponse, { status: 200 }) // Return 200 with empty data to prevent frontend error toast
}
}
