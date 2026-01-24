import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET() {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const requests = await prisma.rejectionRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                application: {
                    include: { user: { select: { fullName: true, email: true } } }
                },
                requestedBy: {
                    select: { fullName: true, photoUrl: true }
                }
            },
            orderBy: { requestedAt: 'asc' }
        })

        return NextResponse.json(requests)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
