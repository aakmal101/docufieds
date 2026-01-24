import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Verify
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })
        if (!application || application.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const requests = await prisma.documentRequest.findMany({
            where: {
                applicationId: params.id,
                status: { in: ['PENDING', 'REJECTED'] }
            },
            orderBy: { requestedAt: 'desc' }
        })

        return NextResponse.json(requests)

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
