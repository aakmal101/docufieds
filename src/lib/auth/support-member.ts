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

export async function createSupportMember(
    leadId: string,
    data: { email: string; fullName: string; tempPassword?: string; phone?: string }
) {
    // Use provided temp password or generate one if strictly needed (but UI usually provides it)
    // For safety, we expect the caller to provide a generated password to show the user once.
    const passwordToHash = data.tempPassword || Math.random().toString(36).slice(-8)
    const passwordHash = await hashPassword(passwordToHash)

    return await prisma.supportTeamMember.create({
        data: {
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            passwordHash,
            leadId,
        }
    })
}

export async function authenticateSupportMember(email: string, password: string) {
    const member = await prisma.supportTeamMember.findUnique({
        where: { email },
        include: {
            _count: {
                select: { assignedApplications: { where: { status: 'ACTIVE' } } }
            }
        }
    });

    if (!member || !member.isActive) {
        return null;
    }

    const isValid = await verifyPassword(password, member.passwordHash);

    if (!isValid) {
        return null;
    }

    // Update last login
    await prisma.supportTeamMember.update({
        where: { id: member.id },
        data: { lastLoginAt: new Date() }
    })

    return member;
}

export async function createSupportSession(member: { id: string, email: string, leadId: string }) {
    const token = await new SignJWT({
        id: member.id,
        email: member.email,
        leadId: member.leadId,
        role: 'SUPPORT_MEMBER'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(new TextEncoder().encode(JWT_SECRET))

    cookies().set(COOKIE_NAME, token, {
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
        return payload as { id: string; email: string; leadId: string; role: string }
    } catch (error) {
        return null
    }
}

export async function destroySupportSession() {
    cookies().delete(COOKIE_NAME)
}
