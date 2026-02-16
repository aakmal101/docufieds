import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Return the agent's current approval status
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'AGENT') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                profileStatus: true,
                profileReviewNotes: true,
                profileReviewedAt: true,
                fullName: true,
                email: true,
                phone: true,
            }
        })

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: {
                profileStatus: user.profileStatus,
                reviewNotes: user.profileReviewNotes,
                reviewedAt: user.profileReviewedAt,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
            }
        })
    } catch (error: any) {
        console.error('[API] Agent Approval GET Error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}

// POST: Submit an approval request
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'AGENT') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { purpose, fullName, email, phone } = body

        if (!purpose || purpose.trim().length < 10) {
            return NextResponse.json(
                { success: false, message: 'Purpose must be at least 10 characters' },
                { status: 400 }
            )
        }

        // Check current status
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { profileStatus: true }
        })

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
        }

        if (user.profileStatus === 'APPROVED') {
            return NextResponse.json({ success: false, message: 'Profile is already approved' }, { status: 400 })
        }

        if (user.profileStatus === 'PENDING_REVIEW') {
            return NextResponse.json({ success: false, message: 'An approval request is already pending' }, { status: 400 })
        }

        // Build update data
        const updateData: any = {
            profileStatus: 'PENDING_REVIEW',
            profileReviewNotes: `[AGENT PURPOSE] ${purpose.trim()}`,
            profileReviewedAt: null,
            profileReviewedById: null,
        }

        // Also update profile info if provided
        if (fullName?.trim()) updateData.fullName = fullName.trim()
        if (email?.trim()) updateData.email = email.trim()
        if (phone?.trim()) updateData.phone = phone.trim()

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        })

        return NextResponse.json({
            success: true,
            message: 'Approval request submitted successfully'
        })

    } catch (error: any) {
        console.error('[API] Agent Approval POST Error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}
