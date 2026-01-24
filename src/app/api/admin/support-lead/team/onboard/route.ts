import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'
import { createSupportMember } from '@/lib/auth/support-member'

export async function POST(req: Request) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { fullName, email, phone, password } = await req.json()

        // Validate email
        const existing = await prisma.supportTeamMember.findUnique({
            where: { email }
        })
        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
        }

        const member = await createSupportMember(session.user.id, {
            email,
            fullName,
            phone,
            tempPassword: password
        })

        return NextResponse.json({ success: true, member })
    } catch (error) {
        console.error('Onboard Error:', error)
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
    }
}
