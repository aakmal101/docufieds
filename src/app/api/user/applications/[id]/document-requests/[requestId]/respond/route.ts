import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string, requestId: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { documentId } = await req.json()

        // 1. Verify Application Ownership
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })
        if (!application || application.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Verify Document exists and belongs to user
        const doc = await prisma.document.findFirst({
            where: { id: documentId, applicationId: params.id }
        })
        if (!doc) return NextResponse.json({ error: 'Invalid document' }, { status: 400 })

        // 3. Update Request
        const request = await prisma.documentRequest.update({
            where: { id: params.requestId },
            data: {
                status: 'UPLOADED',
                responseDocumentId: documentId,
                respondedAt: new Date(),
                userNotes: 'Uploaded via portal'
            }
        })

        // 4. Update Application Status
        await prisma.application.update({
            where: { id: params.id },
            data: { supportStatus: 'USER_RESPONDED' }
        })

        return NextResponse.json({ success: true, request })

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
