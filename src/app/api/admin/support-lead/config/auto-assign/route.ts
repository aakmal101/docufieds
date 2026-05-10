import { NextResponse, NextRequest } from 'next/server'
import { requireSupportLead } from '@/lib/auth/admin-guard'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const user = await requireSupportLead()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.autoAssignmentConfig.findFirst({
        where: { createdById: user.id }
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
    const user = await requireSupportLead()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { isEnabled, assignmentMode, maxActivePerMember } = body

        // Upsert logic (find existing for this lead)
        const existing = await prisma.autoAssignmentConfig.findFirst({
            where: { createdById: user.id }
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
                    createdById: user.id,
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
