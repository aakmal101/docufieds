import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            include: {
                user: true,
                documents: {
                    include: { documentRequests: true } // See if there are open requests for this doc
                },
                payments: true,
                assignment: true,
                documentRequests: {
                    orderBy: { requestedAt: 'desc' }
                },
                supportMessages: {
                    orderBy: { createdAt: 'asc' }
                },
                escalations: {
                    where: { status: 'PENDING' }
                },
                rejectionRequests: {
                    where: { status: 'PENDING' }
                }
            }
        })

        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        // Verify assignment (optional: allow viewing if previously assigned or if generic 'view' permission exists)
        // Strict mode: only if currently assigned to this member
        if (application.assignment?.memberId !== member.id) {
            // We might want to allow read-only access if we implement a 'Team View' later.
            // For now, let's enforce assignment for simplicity or return a limited view.
            return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 })
        }

        return NextResponse.json(application)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    }
}
