import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const user = await requireSupportLead()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { isActive, fullName, phone } = body

        let firstName = undefined;
        let lastName = undefined;

        if (fullName) {
            const parts = fullName.trim().split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }

        const member = await prisma.user.update({
            where: { id: params.id, role: 'SUPPORT' },
            data: {
                ...(isActive !== undefined && { status: isActive ? 'ACTIVE' : 'INACTIVE' }),
                ...( (firstName || lastName || phone) ? {
                    individualProfile: {
                        update: {
                            ...(firstName && { firstName }),
                            ...(lastName !== undefined && { lastName }),
                            ...(phone && { phoneNumber: phone }),
                        }
                    }
                } : {})
            }
        })

        return NextResponse.json({ success: true, member })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const user = await requireSupportLead()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Soft delete
        await prisma.user.update({
            where: { id: params.id, role: 'SUPPORT' },
            data: { status: 'INACTIVE' }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to disable member' }, { status: 500 })
    }
}
