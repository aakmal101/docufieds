import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'

export async function verifySupportMemberToken(request: NextRequest) {
    const token = request.cookies.get('support-member-token')?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        )
        return payload as { id: string; email: string; leadId: string; role: 'SUPPORT_MEMBER' }
    } catch (err) {
        return null
    }
}

export function requireSupportMember(request: NextRequest) {
    const token = request.cookies.get('support-member-token')?.value
    if (!token) {
        return NextResponse.redirect(new URL('/auth/support-member/login', request.url))
    }
    // We can't synchronously verify JWT here easily without blocking 
    // Usually middleware just checks presence, but verifySupportMemberToken can be used in async middleware
    return null
}
