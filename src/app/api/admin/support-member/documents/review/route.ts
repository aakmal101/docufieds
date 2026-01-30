import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export async function POST(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { documentId, status } = body

        if (!documentId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Check if document exists
        const existingDoc = await prisma.document.findUnique({
            where: { id: documentId }
        })

        if (!existingDoc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Update document status
        const document = await prisma.document.update({
            where: { id: documentId },
            data: { status }
        })

        return NextResponse.json(document)

    } catch (error) {
        console.error('Error reviewing document:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
