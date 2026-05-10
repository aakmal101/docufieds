import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPPORT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { reason, category } = await req.json()
        const applicationId = params.id

        // Create rejection request
        const rejection = await prisma.rejectionRequest.create({
            data: {
                applicationId,
                requestedById: user.id,
                reason,
                category: category || 'OTHER',
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true, rejection })

    } catch (error) {
        console.error('Rejection Request Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
