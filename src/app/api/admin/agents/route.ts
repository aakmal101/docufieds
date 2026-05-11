
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function POST(req: NextRequest) {
    try {
        const session = await requireSupportLead()
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { email, fullName, phone, agencyId, password } = body

        if (!email || !fullName || !password) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        // 2. Create User in Supabase Auth (if using Supabase Auth)
        // We typically need to create the auth user first to get the ID, OR we let the user sign up.
        // For "Invite" flow, we often create the DB record first with a "PENDING" status
        // OR we use Supabase Admin API to create the user.

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: 'AGENT' }
        })

        if (authError) {
            return NextResponse.json({ success: false, message: authError.message }, { status: 400 })
        }

        const newUserId = authData.user.id

        const parts = fullName.split(' ')
        const firstName = parts[0]
        const lastName = parts.slice(1).join(' ') || ''

        // 3. Create User in Prisma
        const newUser = await prisma.user.create({
            data: {
                id: newUserId, // Sync ID
                email,
                role: 'AGENT',
                individualProfile: {
                    create: {
                        firstName,
                        lastName,
                        phoneNumber: phone
                    }
                },
                status: 'APPROVED',
                isVerified: true,
                agencyId: agencyId || undefined, // Link to agency if provided
                agentProfile: {
                    create: {
                        displayName: fullName,
                        phone: phone
                    }
                }
            }
        })

        return NextResponse.json({ success: true, data: newUser })

    } catch (error: any) {
        console.error('Error creating agent:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await requireSupportLead()
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = req.nextUrl.searchParams
        const agencyId = searchParams.get('agencyId')
        const agents = await prisma.user.findMany({
            where: {
                role: 'AGENT',
                ...(agencyId ? { agencyId } : {})
            },
            include: {
                agentProfile: true,
                _count: {
                    select: { agentAssignments: true }
                }
            }
        })

        return NextResponse.json({ success: true, data: agents })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
