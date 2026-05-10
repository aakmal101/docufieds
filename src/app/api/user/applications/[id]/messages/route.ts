import { NextResponse, NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (!application || application.userId !== user!.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const messages = await prisma.supportMessage.findMany({
            where: {
                applicationId: params.id,
                isInternal: false // Exclude internal notes
            },
            include: {
                senderUser: { select: { individualProfile: { select: { firstName: true, lastName: true } }, photoUrl: true } },
            },
            orderBy: { createdAt: 'asc' }
        })

        // Mark as read
        await prisma.supportMessage.updateMany({
            where: {
                applicationId: params.id,
                senderType: 'SUPPORT_MEMBER',
                isReadByUser: false
            },
            data: { isReadByUser: true }
        })

        return NextResponse.json(messages)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { content, attachmentUrl, attachmentName, messageType } = await req.json()

        // Verify ownership
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true, assignment: { select: { assignedToId: true } } }
        })

        if (!application || application.userId !== user!.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const message = await prisma.supportMessage.create({
            data: {
                applicationId: params.id,
                content: content || '',
                messageType: messageType || 'TEXT',
                senderType: 'USER',
                senderUserId: user!.id,
                attachmentUrl,
                attachmentName
            },
            include: {
                senderUser: { select: { individualProfile: { select: { firstName: true, lastName: true } }, photoUrl: true } }
            }
        })

        return NextResponse.json(message)
    } catch (error) {
        console.error('Support message creation error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

