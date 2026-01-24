import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { isActive, fullName, phone } = body

        const member = await prisma.supportTeamMember.update({
            where: { id: params.id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(fullName && { fullName }),
                ...(phone && { phone }),
            }
        })

        return NextResponse.json({ success: true, member })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Soft delete
        await prisma.supportTeamMember.update({
            where: { id: params.id },
            data: { isActive: false }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to disable member' }, { status: 500 })
    }
}
