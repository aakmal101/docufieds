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

        // FAIL-SAFE: Ensure the Lead User (current session user) actually exists in the DB
        // If the user is running in "Demo Mode", the session ID might be fake.
        // We must create a real User record to satisfy the Foreign Key constraint.
        const leadUser = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!leadUser) {
            console.log('Lead user not found in DB, creating fallback record for:', session.user.id)
            try {
                await prisma.user.create({
                    data: {
                        id: session.user.id, // Use the session ID so the relationship matches
                        email: session.user.email || `lead-${Date.now()}@docufieds.com`,
                        fullName: session.user.fullName || 'Support Lead',
                        role: 'ADMIN',
                        status: 'APPROVED'
                    }
                })
            } catch (createError) {
                console.error('Failed to create fallback lead user:', createError)
                // If this fails (e.g. email collision but ID distinct?), try to fetch by email?
                // For now, let's assume if ID didn't exist, we can create.
                // If it fails, the next step (createSupportMember) will likely fail too.
            }
        }

        const member = await createSupportMember(session.user.id, {
            email,
            fullName,
            phone,
            tempPassword: password
        })

        return NextResponse.json({ success: true, member })
    } catch (error: any) {
        console.error('Onboard Error:', error)
        // Return explicit error for debugging
        return NextResponse.json({
            error: 'Failed to create member',
            details: error.message
        }, { status: 500 })
    }
}
