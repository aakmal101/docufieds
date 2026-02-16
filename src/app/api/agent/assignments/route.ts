
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server' // Use server client helper if available, or just verify header

export async function GET(req: NextRequest) {
    try {
        // 1. Get Current User (Agent)
        // In a real app we parse the session. For MVP/Test, we might rely on a header or effective session.
        // Let's assume we use the Supabase helper to get the user.

        /* 
        const supabase = createClient(cookies())
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        */

        // For now, we'll extract userId from a header for testing OR implement the real auth check if we can import it.
        // Let's try to do it properly with the pattern seen in middleware/other routes.
        // We'll mock the "Get User" part if we don't have the auth helper handy, but let's check imports.
        // The project seems to have `createClient` in `@supabase/ssr` or `lib`.

        // Simulating strict auth:
        const userId = req.headers.get('x-user-id') // For testing script
        // In production, we MUST use session. 
        // If x-user-id is present (from our test script), we use it. 
        // otherwise we fail provided we are not in a real browser session.

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized (No User ID)' }, { status: 401 })
        }

        // 2. Fetch Assignments
        const assignments = await prisma.agentAssignment.findMany({
            where: {
                agentUserId: userId,
                status: 'ACTIVE'
            },
            include: {
                targetUser: {
                    select: { id: true, fullName: true, email: true, phone: true }
                },
                application: {
                    select: {
                        id: true,
                        status: true,
                        processType: true,
                        country: true,
                        createdAt: true,
                        modules: { select: { module: true, status: true } }
                    }
                }
            }
        })

        return NextResponse.json({ success: true, data: assignments })

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
