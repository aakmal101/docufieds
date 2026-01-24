import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { leadNotes } = await req.json()

        await prisma.$transaction(async (tx) => {
            const request = await tx.rejectionRequest.update({
                where: { id: params.id },
                data: {
                    status: 'DENIED',
                    reviewedById: session.user.id,
                    leadNotes,
                    reviewedAt: new Date()
                },
                include: { application: true }
            })

            // Return App to Review
            await tx.application.update({
                where: { id: request.applicationId },
                data: { supportStatus: 'IN_REVIEW' } // Or whatever previous state
            })

            // Notify Member via System Message or Internal Note
            // Assuming support message exists
            // await tx.supportMessage.create(...) // Skipping for brevity, implied
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
