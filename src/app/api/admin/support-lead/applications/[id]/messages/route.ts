import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/services/auth-service'

// GET: Fetch messages for Support Lead
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPPORT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const messages = await prisma.supportMessage.findMany({
            where: { applicationId: params.id },
            include: {
                senderUser: { select: { photoUrl: true, email: true, individualProfile: { select: { firstName: true, lastName: true } } } }
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('Failed to fetch messages for lead:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

// POST: Send message as Support Lead (System or Direct)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPPORT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { content, isInternal, attachmentUrl, attachmentName } = await req.json()

        const message = await prisma.supportMessage.create({
            data: {
                applicationId: params.id,
                content,
                messageType: 'TEXT',
                senderType: 'SUPPORT_MEMBER',
                senderUserId: user.id,
                isInternal: isInternal || false,
                isReadBySupport: true, // Lead reads their own message
                isReadByUser: isInternal ? false : false, // User hasn't read it yet
                attachmentUrl,
                attachmentName
            },
            include: {
                senderUser: { select: { individualProfile: { select: { firstName: true, lastName: true } } } }
            }
        })

        // Notification logic (only if public)
        if (!isInternal && message.senderType !== 'SYSTEM') {
            const app = await prisma.application.findUnique({
                where: { id: params.id },
                select: { userId: true }
            })
            if (app) {
                await prisma.notification.create({
                    data: {
                        userId: app.userId,
                        title: 'Message from Support Lead',
                        message: content.substring(0, 50) + '...',
                        type: 'MESSAGE'
                    }
                })
            }
        }

        return NextResponse.json(message)
    } catch (error) {
        console.error('Failed to send message as lead:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
