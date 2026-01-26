import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'
import { createSupportMember } from '@/lib/auth/support-member'
import { z } from 'zod'

const onboardSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters")
})

export async function POST(req: Request) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const validated = onboardSchema.parse(body)

        // 1. Check for duplicate email in SupportTeamMember table
        const existingMember = await prisma.supportTeamMember.findUnique({
            where: { email: validated.email }
        })
        if (existingMember) {
            return NextResponse.json({
                error: 'Email already exists',
                details: 'A team member with this email already exists.'
            }, { status: 409 })
        }

        // 2. Resolve Lead ID (Robust "Ghost User" Handling)
        let leadIdToUse = session.user.id

        // Strategy: prefer finding by EMAIL first, as that is the stable identifier in Demo Mode
        // "Shahoriar" might have ID "demo-1" in DB but session says "demo-2"
        const existingLeadByEmail = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: session.user.email },
                    // Also check if email is just the username (common in demo data)
                    { email: 'Shahoriar' },
                    { email: 'shahoriar' }
                ]
            }
        })

        if (existingLeadByEmail) {
            // Found the REAL record in the DB. Use its ID to satisfy Foreign Key.
            console.log(`[Onboard] Found existing Lead User by email. ID: ${existingLeadByEmail.id}`)
            leadIdToUse = existingLeadByEmail.id
        } else {
            // No record by email. Check if ID exists.
            const existingLeadById = await prisma.user.findUnique({
                where: { id: session.user.id }
            })

            if (!existingLeadById) {
                // Neither Email nor ID exists. This is a fresh environment.
                // Create the Lead User record to satisfy FK.
                console.log(`[Onboard] Creating new Lead User record for ID: ${session.user.id}`)
                try {
                    await prisma.user.create({
                        data: {
                            id: session.user.id,
                            email: session.user.email || 'shahoriar@admin.com',
                            fullName: session.user.fullName || 'Support Lead',
                            role: 'ADMIN',
                            status: 'APPROVED'
                        }
                    })
                } catch (createErr) {
                    console.error('[Onboard] Failed to create Lead User fallback:', createErr)
                    // Continue and hope for the best (or fail at FK step)
                }
            }
        }

        // 3. Create the Team Member
        console.log(`[Onboard] Creating member linked to Lead ID: ${leadIdToUse}`)
        const member = await createSupportMember(leadIdToUse, {
            email: validated.email,
            fullName: validated.fullName,
            phone: validated.phone,
            tempPassword: validated.password
        })

        return NextResponse.json({ success: true, member })

    } catch (error: any) {
        console.error('[Onboard] Critical Error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Failed', details: error.errors[0].message }, { status: 400 })
        }

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Database Conflict', details: 'Record already exists.' }, { status: 409 })
        }

        if (error.code === 'P2003') {
            return NextResponse.json({
                error: 'Association Error',
                details: `Could not link to Lead Account. Lead ID ${session.user.id} not found.`
            }, { status: 500 })
        }

        return NextResponse.json({
            error: 'System Error',
            details: error.message || 'An unexpected error occurred'
        }, { status: 500 })
    }
}
