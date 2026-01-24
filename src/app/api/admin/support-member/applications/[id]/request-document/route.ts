import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { documentType, reason, instructions } = await req.json()

        // Create Request
        const docReq = await prisma.documentRequest.create({
            data: {
                applicationId: params.id,
                requestedById: member.id,
                documentType,
                reason,
                instructions,
                status: 'PENDING'
            }
        })

        // Create System Message
        await prisma.supportMessage.create({
            data: {
                applicationId: params.id,
                content: `Document Requested: ${documentType}`,
                messageType: 'DOCUMENT_REQUEST',
                senderType: 'SUPPORT_MEMBER',
                senderMemberId: member.id
            }
        })

        // Update App Status
        await prisma.application.update({
            where: { id: params.id },
            data: { supportStatus: 'Waiting for User' } // Or whatever status enum you use
        })

        return NextResponse.json(docReq)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
