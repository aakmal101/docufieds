
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

// GET: Fetch messages for Support Lead
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const messages = await prisma.supportMessage.findMany({
            where: { applicationId: params.id },
            include: {
                senderUser: { select: { fullName: true, photoUrl: true, email: true } },
                senderMember: { select: { fullName: true, photoUrl: true } }
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
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { content, isInternal, attachmentUrl, attachmentName } = await req.json()

        // Leads send messages as "SYSTEM" (official) or "SUPPORT_MEMBER" (if they have a member profile?)
        // Requirement implies "Lead instructions".
        // Let's use 'SUPPORT_MEMBER' type but with their user ID details if possible, 
        // OR better: if the Lead has a linked SupportProfile, use that.
        // If not, maybe use SYSTEM? 
        // User Requirement: "distinguish between system messages, lead instructions, support member responses"

        // Let's check if the current admin user also has a SupportTeamMember profile.
        const linkedMember = await prisma.supportTeamMember.findFirst({
            where: { email: session.user.email as string }
        })

        let senderType = 'SYSTEM'
        let senderMemberId = null
        let senderUserId: string | null = session.user.id // Fallback to User ID relation?

        if (linkedMember) {
            senderType = 'SUPPORT_MEMBER'
            senderMemberId = linkedMember.id
            senderUserId = null
        } else {
            // If they are just an Admin/Lead without a Member profile (rare but possible),
            // We treat as SYSTEM or generic Admin sender.
            // Schema `SupportMessage` has `senderUserId` and `senderMemberId`.
            // `senderType` options: USER, SUPPORT_MEMBER, SYSTEM.
            // If we use SYSTEM, we can put "Support Lead" in content or metadata?
            // Actually, let's treat Lead as a Member for messaging consistency if possible.
            // If not, we use 'SYSTEM' but that might look like an automated bot.

            // Let's stick to: If no member profile, use 'SYSTEM' but content prefix "[Lead]: "
            senderType = 'SYSTEM'
        }

        const message = await prisma.supportMessage.create({
            data: {
                applicationId: params.id,
                content,
                messageType: 'TEXT',
                senderType,
                senderMemberId,
                senderUserId: senderMemberId ? null : senderUserId,
                // If it's a lead instruction, it's likely internal by default unless specified otherwise?
                // The UI passes `isInternal`.
                isInternal: isInternal || false,
                isReadBySupport: true, // Lead reads their own message
                isReadByUser: isInternal ? false : false, // User hasn't read it yet
                attachmentUrl,
                attachmentName
            },
            include: {
                senderMember: { select: { fullName: true } },
                senderUser: { select: { fullName: true } }
            }
        })

        // Notification logic (only if public)
        if (!isInternal && message.senderType !== 'SYSTEM') { // Don't notify for internal or system logs usually?
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
