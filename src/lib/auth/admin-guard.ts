import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireSupportLead() {
    const session = await getServerSession(authOptions)

    if (!session) {
        console.log('[AdminGuard] No session found')
        return null
    }

    // Normalized role check
    const role = session.user.role as string
    const allowed = ['ADMIN', 'SUPPORT', 'SUPPORT_LEAD']

    if (!allowed.includes(role)) {
        console.log(`[AdminGuard] Unauthorized role: ${role}. Allowed: ${allowed.join(', ')}`)
        return null
    }

    return session
}
