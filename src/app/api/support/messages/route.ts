import { NextResponse, NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

// Helper to determine user context
async function getUserContext(req: NextRequest) {
    // Check for Support Member Token first (cookies)
    const supportMember = await verifySupportMemberToken(req)
    if (supportMember) return { type: 'SUPPORT_MEMBER', id: supportMember.id }

    // Check for Supabase Auth (headers/cookies via Supabase Auth)
    // Note: getCurrentUser needs clean headers in API route
    const user = await getCurrentUser()
    if (user?.id) return { type: 'USER', id: user.id }

    return null
}

export async function GET(req: NextRequest) {
    const context = await getUserContext(req)
    if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const applicationId = searchParams.get('applicationId')

    if (!applicationId) return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })

    // Access control:
    // If User: must own the application
    // If Support: must be assigned (or Lead/Admin can view all - for now loose assignment check or just allow support members to view)
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { userId: true, assignment: { select: { assignedToId: true } } }
    })

    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (context.type === 'USER' && application.userId !== context.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // For support, we assume they can view if they have a token (since they might need to see history before assignment or as lead)

    const messages = await prisma.supportMessage.findMany({
        where: {
            applicationId,
            // If User, hide internal messages
            ...(context.type === 'USER' ? { isInternal: false } : {})
        },
        include: {
            senderUser: { select: { individualProfile: { select: { firstName: true, lastName: true } }, photoUrl: true } },
        },
        orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
    const context = await getUserContext(req)
    if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { applicationId, content, messageType = 'TEXT' } = body

        if (!applicationId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

        // Validate access similarly to GET
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        })

        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (context.type === 'USER' && application.userId !== context.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const message = await prisma.supportMessage.create({
            data: {
                applicationId,
                content,
                messageType,
                senderType: context.type,
                // Polymorphic ID setting
                ...(context.type === 'USER' ? { senderUserId: context.id } : { senderUserId: context.id }),
                isInternal: false // Default to public
            },
            include: {
                senderUser: { select: { individualProfile: { select: { firstName: true, lastName: true } }, photoUrl: true } },
            }
        })

        return NextResponse.json(message)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
