import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifySupportMemberToken } from '@/middleware/support-member'

// POST: Create a request (Support Member only)
export async function POST(req: NextRequest) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { applicationId, documentType, reason, instructions } = await req.json()

        const request = await prisma.documentRequest.create({
            data: {
                applicationId,
                requestedById: member.id,
                documentType,
                reason,
                instructions,
                status: 'PENDING'
            }
        })

        // Notify user via system message
        await prisma.supportMessage.create({
            data: {
                applicationId,
                content: `Document Requested: ${documentType}. Reason: ${reason}`,
                messageType: 'DOCUMENT_REQUEST',
                senderType: 'SYSTEM',
                senderMemberId: member.id
            }
        })

        return NextResponse.json(request)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }
}

// PUT: Respond to request (User only - upload file logic is separate, here we link it)
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { requestId, documentId } = await req.json()

        // Verify ownership
        const request = await prisma.documentRequest.findUnique({
            where: { id: requestId },
            include: { application: true }
        })

        if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (request.application.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const updated = await prisma.documentRequest.update({
            where: { id: requestId },
            data: {
                status: 'UPLOADED',
                responseDocumentId: documentId,
                respondedAt: new Date()
            }
        })

        // Notify support
        await prisma.supportMessage.create({
            data: {
                applicationId: request.applicationId,
                content: `Document Uploaded: ${request.documentType}`,
                messageType: 'STATUS_UPDATE',
                senderType: 'SYSTEM',
                senderUserId: session.user.id
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }
}
