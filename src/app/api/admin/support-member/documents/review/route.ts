import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Verify support member role
        const member = await prisma.supportTeamMember.findUnique({
            where: { email: session.user.email }
        })
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { documentId, status, reason } = await req.json()

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Update document status
        const document = await prisma.document.update({
            where: { id: documentId },
            data: { status }
        })

        // Log the action (Optional: create a status update or audit log if needed, for now just updating doc)
        // If rejected, we might want to create a DocumentRequest automatically, but let's keep it manual for now as per plan.

        return NextResponse.json(document)

    } catch (error) {
        console.error('Error reviewing document:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
