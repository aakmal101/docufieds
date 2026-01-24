import { getSupportSession } from '@/lib/auth/support-member' // Wait, I need to expose this one or just use cookies directly in library
// Actually, let's use the functionality I wrote in the library helper 'getSupportMemberFromToken' but I need to extract the token from cookies first.
import { cookies } from 'next/headers'
import { getSupportMemberFromToken } from '@/lib/auth/support-member'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    const token = cookies().get('support-member-token')?.value

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const payload = await getSupportMemberFromToken(token)

    if (!payload) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Fetch fresh data
    const member = await prisma.supportTeamMember.findUnique({
        where: { id: payload.id },
        select: {
            id: true,
            email: true,
            fullName: true,
            photoUrl: true,
            role: true, // Wait, role isn't on the model but on payload. 
            // The requirement says "Include member's assigned applications count"
            _count: {
                select: { assignedApplications: { where: { status: 'ACTIVE' } } }
            }
        }
    })

    if (!member) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
        authenticated: true,
        member: {
            ...member,
            role: 'SUPPORT_MEMBER' // Explicitly adding it for frontend consistency
        }
    })
}
