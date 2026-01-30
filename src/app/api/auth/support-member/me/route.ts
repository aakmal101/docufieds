import { NextResponse } from 'next/server'
import { verifySupportMemberToken } from '@/middleware/support-member'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch fresh data
        const fullMember = await prisma.supportTeamMember.findUnique({
            where: { id: member.id },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        })

        if (!fullMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        return NextResponse.json(fullMember)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
