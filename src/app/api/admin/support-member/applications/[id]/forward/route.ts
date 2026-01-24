import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Validate (omitted strict verification checks for brevity/mock)

        await prisma.application.update({
            where: { id: params.id },
            data: {
                supportStatus: 'FORWARDED_TO_LEGAL',
                status: 'DOCUMENT_UNDER_REVIEW', // Official status
                forwardedToLegalAt: new Date()
            }
        })

        // Mark assignment completed
        await prisma.applicationAssignment.update({
            where: { applicationId: params.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
