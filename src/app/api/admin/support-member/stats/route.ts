import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySupportMemberToken } from '@/middleware/support-member'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const member = await verifySupportMemberToken(req as any)
        if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Active Count
        const activeCount = await prisma.applicationAssignment.count({
            where: {
                assignedToId: member.id,
                status: 'ACTIVE'
            }
        })

        // 2. Completed Today
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const completedToday = await prisma.applicationAssignment.count({
            where: {
                assignedToId: member.id,
                status: 'COMPLETED',
                completedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        // 3. Pending Response (Waiting for User)
        // Check filtering logic: Application supportStatus is 'Waiting for User' 
        // AND assignment is ACTIVE? Usually if waiting for user, assignment is still active.
        const pendingResponse = await prisma.applicationAssignment.count({
            where: {
                assignedToId: member.id,
                status: 'ACTIVE',
                application: {
                    supportStatus: 'Waiting for User' // Ensure exact string match from other parts of app
                }
            }
        })

        return NextResponse.json({
            activeCount,
            completedToday,
            pendingResponse
        })

    } catch (error) {
        console.error('Member Stats Error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
