import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Return the agent's current approval status
export async function GET() {
    try {
        const authUser = await getCurrentUser()
        if (!authUser?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (authUser.role !== 'AGENT') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                profileStatus: true,
                profileReviewNotes: true,
                profileReviewedAt: true,
                individualProfile: { select: { firstName: true, lastName: true, phoneNumber: true } },
                email: true,
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
                fullName: user.individualProfile ? `${user.individualProfile.firstName} ${user.individualProfile.lastName}`.trim() : null,
                email: user.email,
                phone: user.individualProfile?.phoneNumber,
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
        const authUser = await getCurrentUser()
        if (!authUser?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (authUser.role !== 'AGENT') {
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
            where: { id: authUser.id },
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
        if (email?.trim()) updateData.email = email.trim()
        
        if (fullName?.trim() || phone?.trim()) {
            const parts = fullName?.trim() ? fullName.trim().split(' ') : [];
            updateData.individualProfile = {
                upsert: {
                    create: {
                        firstName: parts[0] || '',
                        lastName: parts.slice(1).join(' ') || '',
                        phoneNumber: phone?.trim() || undefined
                    },
                    update: {
                        ...(fullName?.trim() ? { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' } : {}),
                        ...(phone?.trim() ? { phoneNumber: phone.trim() } : {})
                    }
                }
            }
        }

        await prisma.user.update({
            where: { id: authUser.id },
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
