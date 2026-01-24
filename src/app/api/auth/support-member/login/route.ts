import { authenticateSupportMember, createSupportSession } from '@/lib/auth/support-member'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password } = loginSchema.parse(body)

        const member = await authenticateSupportMember(email, password)

        if (!member) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            )
        }

        if (!member.isActive) {
            return NextResponse.json(
                { success: false, message: 'Account is disabled. Contact your team lead.' },
                { status: 403 }
            )
        }

        // Create session (sets cookie)
        await createSupportSession({
            id: member.id,
            email: member.email,
            leadId: member.leadId
        })

        const { passwordHash, ...safeMember } = member

        return NextResponse.json({ success: true, member: safeMember })
    } catch (error) {
        console.error('Support login error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
