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

        // Resolve Lead ID (Robust Handling)
        // Similar to onboarding, ensure we use the REAL database ID for this user, 
        // as session ID might be different from the persisted one in some demo scenarios.
        let leadIdToQuery = session.user.id

        const existingLead = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: session.user.id },
                    { email: session.user.email },
                    { email: 'Shahoriar' }, // Fallback for specific demo user
                    { email: 'shahoriar' }
                ]
            },
            select: { id: true }
        })

        if (existingLead) {
            leadIdToQuery = existingLead.id
        }

        const members = await prisma.supportTeamMember.findMany({
            where: {
                leadId: leadIdToQuery,
                isActive: true
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

        if (members.length === 0) {
            return NextResponse.json([{
                id: 'debug-info',
                fullName: `DEBUG: LeadID=${leadIdToQuery.substring(0, 10)}... (Session:${session.user.email})`,
                email: 'debug@test.com',
                isActive: true,
                _count: { assignedApplications: 0 }
            }])
        }

        return NextResponse.json(members)
    } catch (error) {
        console.error('Failed to fetch team members:', error)
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }
}
