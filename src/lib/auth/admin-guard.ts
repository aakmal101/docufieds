import { getCurrentUser } from '@/lib/services/auth-service'

export async function requireSupportLead() {
    const user = await getCurrentUser()

    if (!user) {
        console.log('[AdminGuard] No user found')
        return null
    }

    // Normalized role check
    const role = user.role as string
    const allowed = ['ADMIN', 'SUPPORT', 'SUPPORT_LEAD']

    if (!allowed.includes(role)) {
        console.log(`[AdminGuard] Unauthorized role: ${role}. Allowed: ${allowed.join(', ')}`)
        return null
    }

    return user
}

export async function requireLegal() {
    const user = await getCurrentUser()

    if (!user) return null

    const role = user.role as string
    const allowed = ['ADMIN', 'LEGAL']

    if (!allowed.includes(role)) return null

    return user
}


export async function requireProfileReviewer() {
    const user = await getCurrentUser()

    if (!user) return null

    const role = user.role as string
    // Allow ADMIN and SUPPORT (and LEAD as they are super-support)
    const allowed = ['ADMIN', 'SUPPORT', 'SUPPORT_LEAD']

    if (!allowed.includes(role)) return null

    return user
}
