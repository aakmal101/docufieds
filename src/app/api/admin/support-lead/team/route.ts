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
        console.log(`[Team API] Fetching members for Lead: ${session.user.email} (${session.user.id})`)
        const members = await prisma.supportTeamMember.findMany({
            // Show ALL members regardless of status, as requested
            // where: { isActive: true }, 
            select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true, // Include status so we can show it
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
