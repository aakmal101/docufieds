import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPPORT_LEAD'].includes(session.user?.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { reason, category } = await req.json()
        const applicationId = params.id

        // Get SupportTeamMember ID
        const member = await prisma.supportTeamMember.findUnique({
            where: { email: session.user.email! }
        })

        if (!member) {
            return NextResponse.json({ error: 'Support Member profile not found' }, { status: 404 })
        }

        // Create rejection request
        const rejection = await prisma.rejectionRequest.create({
            data: {
                applicationId,
                requestedById: member.id,
                reason,
                category: category || 'OTHER',
                status: 'PENDING'
            }
        })

        // We probably need to update Application status too?
        // User Request: "When clicked, the button should create a rejection request with the status set to "PENDING"."
        // It doesn't explicitly say update App status, but usually it blocks the app.
        // Let's just create the request as asked.

        return NextResponse.json({ success: true, rejection })

    } catch (error) {
        console.error('Rejection Request Error:', error)
        // Fallback: If relation issue, we need to fix the ID logic.
        // Let's make sure we find the member ID.
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
