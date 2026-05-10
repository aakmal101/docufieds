import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = await requireSupportLead()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const members = await prisma.user.findMany({
            where: {
                role: 'SUPPORT',
                status: 'APPROVED'
            },
            select: {
                id: true,
                email: true,
                status: true,
                individualProfile: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: { assignedApplications: { where: { status: 'ACTIVE' } } }
                }
            }
        })

        const formattedMembers = members.map(m => ({
            id: m.id,
            fullName: m.individualProfile ? `${m.individualProfile.firstName} ${m.individualProfile.lastName || ''}`.trim() : 'Support Member',
            email: m.email,
            isActive: m.status === 'APPROVED' || m.status === 'ACTIVE',
            _count: {
                assignedApplications: m._count.assignedApplications
            }
        }))

        formattedMembers.sort((a, b) => a.fullName.localeCompare(b.fullName))

        return NextResponse.json(formattedMembers)
    } catch (error) {
        console.error('Failed to fetch team members:', error)
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }
}
