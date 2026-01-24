import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET() {
    const session = await requireSupportLead()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const members = await prisma.supportTeamMember.findMany({
            where: { isActive: true },
            select: {
                id: true,
                fullName: true,
                email: true,
                _count: {
                    select: { assignedApplications: { where: { status: 'ACTIVE' } } }
                }
            },
            orderBy: { fullName: 'asc' }
        })

        return NextResponse.json(members)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }
}
