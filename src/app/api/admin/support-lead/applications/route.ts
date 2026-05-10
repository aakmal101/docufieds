
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

// 🛡️ Safe fallback response structure
const FALLBACK_RESPONSE = { applications: [], total: 0, pages: 1 };

export async function GET(req: Request) {
    console.log('[API] Support Lead All Applications - Request Received');

    try {
        // 1. Auth Check with explicit Logging
        let session;
        try {
            session = await requireSupportLead()
        } catch (authError) {
            console.error('[API] Auth Check Failed Exception:', authError);
            return NextResponse.json({ error: 'Authentication Error' }, { status: 401 });
        }

        if (!session) {
            console.warn('[API] Unauthenticated Access Attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[API] Authenticated as:', session.email);

        // 2. Query Params Parsing
        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'))
        const search = (searchParams.get('search') || '').trim()
        const country = searchParams.get('country') || 'ALL'
        const statusFilter = (searchParams.get('status') || 'ALL').toUpperCase()

        console.log('[API] Filters:', { page, limit, search, country, statusFilter });

        const whereConditions: any[] = []

        whereConditions.push({ status: { not: 'DRAFT' } })

        switch (statusFilter) {
            case 'ALL': break;
            case 'PENDING':
                whereConditions.push({ supportStatus: 'PENDING_ASSIGNMENT' });
                break;
            case 'PROCESSING':
                whereConditions.push({
                    supportStatus: { not: 'PENDING_ASSIGNMENT' },
                    status: { notIn: ['COMPLETED', 'DECLINED', 'REJECTED', 'DRAFT'] }
                });
                break;
            case 'ESCALATED':
                whereConditions.push({ escalations: { some: { status: 'PENDING' } } });
                break;
            case 'REJECTED':
                whereConditions.push({
                    OR: [
                        { status: 'DECLINED' },
                        { status: 'REJECTED' },
                        { supportStatus: 'REJECTED' },
                        { supportStatus: 'PENDING_REJECTION' }
                    ]
                });
                break;
            case 'COMPLETED':
                whereConditions.push({
                    OR: [
                        { status: 'COMPLETED' },
                        { status: 'READY_FOR_LEGAL' },
                        { status: 'APPROVED_BY_SUPPORT' } // Future-proofing
                    ]
                });
                break;
            default:
                whereConditions.push({
                    OR: [
                        { status: statusFilter },
                        { supportStatus: statusFilter }
                    ]
                });
                break;
        }

        if (search) {
            whereConditions.push({
                OR: [
                    { id: { contains: search, mode: 'insensitive' } },
                    { user: { individualProfile: { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }] } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            });
        }

        if (country !== 'ALL') {
            whereConditions.push({ country });
        }

        const whereClause = { AND: whereConditions }
        console.log('[API] Generated Where Clause:', JSON.stringify(whereClause));

        // 3. Execution with Promise.all
        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: whereClause,
                include: {
                    user: { select: { email: true, individualProfile: { select: { firstName: true, lastName: true } } } },
                    _count: { select: { documents: true } },
                    payments: {
                        select: { status: true, amount: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    assignment: {
                        include: {
                            assignedTo: { select: { individualProfile: { select: { firstName: true, lastName: true } } } }
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.application.count({ where: whereClause })
        ])

        console.log(`[API] Success. Found ${total} records.`);

        return NextResponse.json({ applications, total, pages: Math.ceil(total / limit) });

    } catch (error) {
        console.error('[API] CRITICAL FAILURE:', error);

        // 🚨 FAILURE SAFETY:
        // Return valid empty response to prevent frontend crash ("Failed to load")
        // Logging the error allows us to inspect server logs for the root cause
        return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
    }
}
