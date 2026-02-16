
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = params instanceof Promise ? await params : params
        const id = resolvedParams.id

        const uploadSession = await (prisma as any).uploadSession.findUnique({
            where: { id },
            include: {
                createdByUser: {
                    select: { id: true, fullName: true, email: true }
                },
                targetUser: {
                    select: { id: true, fullName: true, email: true }
                },
                application: {
                    select: { id: true, country: true, processType: true }
                },
                slots: {
                    orderBy: { slotIndex: 'asc' },
                    include: {
                        uploadedDocument: true
                    }
                }
            }
        })

        if (!uploadSession) {
            return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: uploadSession })

    } catch (error: any) {
        console.error('Error fetching upload session:', error)
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
