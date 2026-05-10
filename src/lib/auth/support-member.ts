import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
const COOKIE_NAME = 'support-member-token'

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
}

/**
 * Create a support user using the normalized User model with role SUPPORT.
 * The old SupportTeamMember model has been deleted.
 */
export async function createSupportMember(
    leadId: string,
    data: { email: string; fullName: string; tempPassword?: string; phone?: string }
) {
    const passwordToHash = data.tempPassword || Math.random().toString(36).slice(-8)
    const passwordHash = await hashPassword(passwordToHash)

    // Split fullName into firstName / lastName for IndividualProfile
    const nameParts = data.fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || null

    return await prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            role: 'SUPPORT',
            status: 'ACTIVE',
            isVerified: true,
            individualProfile: {
                create: {
                    firstName,
                    lastName,
                    phoneNumber: data.phone || null,
                }
            },
            supportProfile: {
                create: {
                    department: 'General',
                }
            },
        },
        include: {
            individualProfile: true,
            supportProfile: true,
        }
    })
}

/**
 * Authenticate a support user using the normalized User model.
 */
export async function authenticateSupportMember(email: string, password: string) {
    const user = await prisma.user.findFirst({
        where: {
            email,
            role: 'SUPPORT',
        },
        include: {
            individualProfile: true,
            supportProfile: true,
            assignedApplications: {
                where: { status: 'ACTIVE' }
            }
        }
    });

    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
        return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        return null;
    }

    return user;
}

export async function createSupportSession(member: { id: string, email: string | null }) {
    const token = await new SignJWT({
        id: member.id,
        email: member.email,
        role: 'SUPPORT'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(new TextEncoder().encode(JWT_SECRET))

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8 // 8 hours
    })

    return token
}

export async function getSupportMemberFromToken(token: string) {
    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        )
        return payload as { id: string; email: string; role: string }
    } catch (error) {
        return null
    }
}

export async function destroySupportSession() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
