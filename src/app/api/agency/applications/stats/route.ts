import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/agency/applications/stats
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const applications = await prisma.application.findMany({
            where: { userId: session.user.id },
            select: {
                status: true,
                createdAt: true,
            },
        })

        const total = applications.length
        const completed = applications.filter(a => a.status === 'COMPLETED').length
        const processing = applications.filter(a =>
            ['UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW', 'DOCUMENT_UNDER_PROCESSING', 'PROCESSED'].includes(a.status)
        ).length
        const declined = applications.filter(a => a.status === 'DECLINED').length

        const successRate = total > 0 ? (completed / total) * 100 : 0

        return NextResponse.json({
            success: true,
            data: {
                total,
                completed,
                processing,
                declined,
                successRate: Math.round(successRate * 10) / 10,
            },
        })
    } catch (error) {
        console.error('Error fetching application stats:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stats' },
            { status: 500 }
        )
    }
}
