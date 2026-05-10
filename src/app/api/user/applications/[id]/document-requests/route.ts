import { NextResponse, NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Verify
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })
        if (!application || application.userId !== user!.id) {
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
