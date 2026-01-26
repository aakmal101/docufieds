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
        let leadIdToUse = session.user.id

        const leadUserById = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!leadUserById) {
            console.log('Lead user ID not found, checking by email for ghost records...')
            // Check if email exists (Ghost User from previous dynamic ID sessions)
            const leadUserByEmail = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: session.user.email },
                        { phone: session.user.phone },
                        { email: 'shahoriar' }, // In case email is just username
                    ]
                }
            })

            if (leadUserByEmail) {
                console.log('Found existing user by email, reusing ID:', leadUserByEmail.id)
                leadIdToUse = leadUserByEmail.id
            } else {
                console.log('No user found, creating new Lead User record...')
                try {
                    const newUser = await prisma.user.create({
                        data: {
                            id: session.user.id,
                            email: session.user.email || `lead-${Date.now()}@docufieds.com`,
                            fullName: session.user.fullName || 'Support Lead',
                            role: 'ADMIN',
                            status: 'APPROVED'
                        }
                    })
                    leadIdToUse = newUser.id
                } catch (createError) {
                    console.error('Failed to create fallback lead user:', createError)
                }
            }
        }

        const member = await createSupportMember(leadIdToUse, {
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
