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

        if (members.length === 0) {
            const count = await prisma.supportTeamMember.count()
            return NextResponse.json([{
                id: 'debug-info',
                fullName: `DEBUG: No members found. DB Count: ${count}`,
                email: 'debug@test.com',
                isActive: true,
                _count: { assignedApplications: 0 }
            }])
        }

        return NextResponse.json(members)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }
}
