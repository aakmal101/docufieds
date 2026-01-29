import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await requireSupportLead()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const members = await prisma.supportTeamMember.findMany({
            where: {
                leadId: session.user.id
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                _count: {
                    select: { assignedApplications: { where: { status: 'ACTIVE' } } }
                }
            },
            orderBy: { fullName: 'asc' }
        })

        return NextResponse.json(members)
    } catch (error) {
        console.error('Failed to fetch team members:', error)
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }
}
