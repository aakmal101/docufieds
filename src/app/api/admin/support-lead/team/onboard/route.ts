import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const onboardSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters")
})

export async function POST(req: Request) {
    const user = await requireSupportLead()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const validated = onboardSchema.parse(body)

        // 1. Check for duplicate email in User table
        const existingMember = await prisma.user.findFirst({
            where: { email: validated.email }
        })
        if (existingMember) {
            return NextResponse.json({
                error: 'Email already exists',
                details: 'A user with this email already exists.'
            }, { status: 409 })
        }

        const passwordHash = await bcrypt.hash(validated.password, 12)

        const names = validated.fullName.split(' ')
        const firstName = names[0]
        const lastName = names.slice(1).join(' ') || ''

        // 3. Create the Team Member as a User with SUPPORT role and supportProfile
        console.log(`[Onboard] Creating member...`)
        const member = await prisma.user.create({
            data: {
                email: validated.email,
                role: 'SUPPORT',
                status: 'APPROVED',
                passwordHash,
                supportProfile: {
                    create: {
                        department: 'General Support',
                        activeTicketsCount: 0
                    }
                },
                individualProfile: {
                    create: {
                        firstName: firstName,
                        lastName: lastName,
                        phoneNumber: validated.phone
                    }
                }
            },
            include: {
                supportProfile: true,
                individualProfile: true
            }
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

        return NextResponse.json({
            error: 'System Error',
            details: error.message || 'An unexpected error occurred'
        }, { status: 500 })
    }
}
