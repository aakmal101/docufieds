import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SUPPORT_LEAD') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.autoAssignmentConfig.findFirst({
        where: { createdById: session.user.id }
    })

    // Return default if none exists
    if (!config) {
        return NextResponse.json({
            isEnabled: true,
            assignmentMode: 'ROUND_ROBIN',
            maxActivePerMember: 10
        })
    }

    return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SUPPORT_LEAD') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { isEnabled, assignmentMode, maxActivePerMember } = body

        // Upsert logic (find existing for this lead)
        const existing = await prisma.autoAssignmentConfig.findFirst({
            where: { createdById: session.user.id }
        })

        let config
        if (existing) {
            config = await prisma.autoAssignmentConfig.update({
                where: { id: existing.id },
                data: { isEnabled, assignmentMode, maxActivePerMember }
            })
        } else {
            config = await prisma.autoAssignmentConfig.create({
                data: {
                    createdById: session.user.id,
                    isEnabled,
                    assignmentMode,
                    maxActivePerMember
                }
            })
        }

        return NextResponse.json(config)
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
