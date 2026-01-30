import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (!application || application.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const messages = await prisma.supportMessage.findMany({
            where: {
                applicationId: params.id,
                isInternal: false // Exclude internal notes
            },
            include: {
                senderUser: { select: { fullName: true, photoUrl: true } },
                senderMember: { select: { fullName: true, photoUrl: true } }
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { content, attachmentUrl, attachmentName } = await req.json()

        // Verify ownership
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true, assignment: { select: { memberId: true } } }
        })

        if (!application || application.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const message = await prisma.supportMessage.create({
            data: {
                applicationId: params.id,
                content,
                messageType: 'TEXT',
                senderType: 'USER',
                senderUserId: session.user.id,
                attachmentUrl,
                attachmentName
            },
            include: {
                senderUser: { select: { fullName: true, photoUrl: true } }
            }
        })

        // Notify assigned support member? (Ideally yes, via system or email, or they just see it)
        // For now, no explicit notification model for support, but simpler.

        return NextResponse.json(message)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
