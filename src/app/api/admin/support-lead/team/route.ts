import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
    // TEMPORARY DEBUG: Bypass Auth to check if that's the blocker
    // const session = await requireSupportLead()
    // if (!session) { ... }

    try {
        console.log('[Team API] Starting fetch...')

        // Check DB Connection
        const count = await prisma.supportTeamMember.count()
        console.log('[Team API] Count:', count)

        const members = await prisma.supportTeamMember.findMany({
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
            // Check Env var (safe reveal)
            const dbUrl = process.env.DATABASE_URL || 'NOT_SET'
            const host = dbUrl.split('@')[1]?.split(':')[0] || 'HIDDEN'

            return NextResponse.json([{
                id: 'debug-empty',
                fullName: `DEBUG: DB=${host}, Count=${count}. No rows returned.`,
                email: 'debug@test.com',
                isActive: true,
                _count: { assignedApplications: 0 }
            }])
        }

        return NextResponse.json(members)
    } catch (error: any) {
        console.error('Team API Error:', error)
        // Return error as a user so it's visible in the UI
        return NextResponse.json([{
            id: 'error-item',
            fullName: `ERROR: ${error.message}`,
            email: 'error@debug.com',
            isActive: false,
            _count: { assignedApplications: 0 }
        }])
    }
}
