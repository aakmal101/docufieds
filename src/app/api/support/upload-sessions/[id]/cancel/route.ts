
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getCurrentUser()
        if (!user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = params instanceof Promise ? await params : params
        const id = resolvedParams.id

        // Verify session exists
        const uploadSession = await (prisma as any).uploadSession.findUnique({
            where: { id }
        })

        if (!uploadSession) {
            return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
        }

        // Cancel session
        const updatedSession = await (prisma as any).uploadSession.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date()
            }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                actorUserId: user!.id,
                action: 'UPLOAD_SESSION_CANCELLED',
                targetUserId: uploadSession.targetUserId,
                metadata: { sessionId: id }
            }
        })

        return NextResponse.json({ success: true, message: 'Session cancelled', data: updatedSession })

    } catch (error: any) {
        console.error('Error cancelling upload session:', error)
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
