import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser()
    if (!user || !['SUPPORT', 'LEGAL'].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { destination } = await req.json() // e.g., 'LEGAL'
        const applicationId = params.id

        if (destination !== 'LEGAL') {
            return NextResponse.json({ error: 'Invalid destination' }, { status: 400 })
        }

        // Update application status
        const app = await prisma.application.update({
            where: { id: applicationId },
            data: {
                status: 'READY_FOR_LEGAL',
                forwardedToLegalAt: new Date(),
                supportStatus: 'VERIFIED' // Assume verified if moving to Legal?
            }
        })

        // Log status update
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'PROCESSING',
                toStatus: 'READY_FOR_LEGAL',
                changedByType: user!.role || 'SYSTEM',
                changedById: user!.id,
                notes: 'Forwarded to Legal Team for final review.'
            }
        })

        // Close the active assignment if it exists
        await prisma.applicationAssignment.updateMany({
            where: {
                applicationId: applicationId,
                status: 'ACTIVE'
            },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        return NextResponse.json({ success: true, app })

    } catch (error) {
        console.error('Forward to Legal Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
