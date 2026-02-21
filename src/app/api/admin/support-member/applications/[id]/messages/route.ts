import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

// GET: Messages for member
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const messages = await prisma.supportMessage.findMany({
            where: { applicationId: params.id },
            include: {
                senderUser: { select: { fullName: true, photoUrl: true } },
                senderMember: { select: { fullName: true, photoUrl: true } }
            },
            orderBy: { createdAt: 'asc' }
        })

        // Mark as read asynchronously (fire and forget)
        prisma.supportMessage.updateMany({
            where: { applicationId: params.id, isReadBySupport: false, senderType: 'USER' },
            data: { isReadBySupport: true }
        })

        return NextResponse.json(messages)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// POST: Send from member
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const member = await verifySupportMemberToken(req)
    if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { content, isInternal, attachmentUrl, attachmentName, messageType } = await req.json()

        const message = await prisma.supportMessage.create({
            data: {
                applicationId: params.id,
                content: content || '',
                messageType: messageType || 'TEXT',
                senderType: 'SUPPORT_MEMBER',
                senderMemberId: member.id,
                isInternal: isInternal || false,
                isReadBySupport: true,
                attachmentUrl,
                attachmentName
            },
            include: {
                senderMember: { select: { fullName: true } }
            }
        })

        // Notification if public
        if (!isInternal) {
            const app = await prisma.application.findUnique({
                where: { id: params.id },
                select: { userId: true }
            })
            if (app) {
                const previewText = messageType === 'VOICE' ? 'Sent a voice message' : (content.substring(0, 50) + '...')
                await prisma.notification.create({
                    data: {
                        userId: app.userId,
                        title: 'New Message from Support',
                        message: previewText,
                        type: 'MESSAGE'
                    }
                })
            }
        }

        return NextResponse.json(message)
    } catch (error) {
        console.error('Admin support message creation error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

