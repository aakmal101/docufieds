
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/services/auth-service'

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }
        
        const body = await req.json()
        const { applicationId, content, messageType } = body
        const userId = user.id

        if (!userId || !applicationId || !content) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        // Verify Assignment
        const assignment = await prisma.agentAssignment.findFirst({
            where: {
                agentUserId: userId,
                OR: [
                    { applicationId: applicationId },
                    {
                        targetUser: {
                            applications: { some: { id: applicationId } }
                        }
                    }
                ],
                status: 'ACTIVE'
            }
        })

        if (!assignment) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        // Send Message
        const message = await prisma.supportMessage.create({
            data: {
                applicationId,
                content,
                messageType: messageType || 'TEXT',
                senderType: 'AGENT',
                senderUserId: userId,
                isReadByUser: false,
                isReadBySupport: true // Internal?
            }
        })

        return NextResponse.json({ success: true, data: message })

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
