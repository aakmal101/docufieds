import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const member = await verifySupportMemberToken(req)
    if (!member) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const assignments = await prisma.applicationAssignment.findMany({
            where: {
                memberId: member.id,
                status: 'ACTIVE'
            },
            include: {
                application: {
                    select: {
                        id: true,
                        userId: true,
                        user: { select: { id: true, fullName: true, email: true } },
                        country: true,
                        processType: true,
                        status: true,
                        supportStatus: true,
                        payments: { select: { status: true }, take: 1 },
                        _count: { select: { documents: true } }
                    }
                }
            },
            orderBy: { priority: 'desc' } // HIGH priority first
        })

        return NextResponse.json(assignments)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }
}
