import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    // 1. Try standard Supabase Auth (for Admins, Leads, and standard Support)
    const user = await getCurrentUser()

    // 2. If no valid session, try Support Member Token (Custom Auth)
    let memberAuth = null;
    if (!user || !user?.role) {
        const { verifySupportMemberToken } = await import('@/middleware/support-member');
        const member = await verifySupportMemberToken(req);
        if (member) {
            memberAuth = {
                user: {
                    id: member.id, // This is member.id or user.id? Usually member.id
                    role: 'SUPPORT_MEMBER',
                    email: 'support-member-action'
                }
            };
        }
    }

    const effectiveUser = user || memberAuth?.user;

    console.log('Payment Create Auth:', {
        method: user ? 'Supabase' : (memberAuth ? 'SupportToken' : 'None'),
        role: effectiveUser?.role
    })

    if (!effectiveUser || !['SUPPORT', 'SUPPORT_LEAD', 'SUPPORT_MEMBER', 'ADMIN'].includes(effectiveUser.role || '')) {
        console.log('Unauthorized Access Attempt - Role Mismatch:', effectiveUser?.role)
        return NextResponse.json({ error: `Unauthorized. Role: ${effectiveUser?.role}` }, { status: 401 })
    }

    try {
        const applicationId = params.id
        const { amount, currency, method, transactionId, notes } = await req.json()

        if (!amount || !method) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        // Get application to link user
        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        })

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Create Payment Record (Automatically Verified since created by Support)
        const payment = await prisma.payment.create({
            data: {
                applicationId,
                userId: app.userId,
                amount: parseFloat(amount),
                status: 'VERIFIED', // Auto-verify
                method,
                transactionId,
                paidAt: new Date(),
                description: 'Manual payment recorded by support'
            }
        })

        // Update Application Status to reflect payment success
        await prisma.application.update({
            where: { id: applicationId },
            data: {
                supportStatus: 'VERIFIED',
                lastActivityAt: new Date()
            }
        })

        // Log the action
        await prisma.applicationStatusUpdate.create({
            data: {
                applicationId,
                fromStatus: 'PENDING_PAYMENT',
                toStatus: 'PAYMENT_VERIFIED',
                changedByType: effectiveUser.role || 'SUPPORT',
                changedById: effectiveUser.id,
                notes: `Manual payment of ${amount} ${currency || 'BDT'} recorded and verified. ${notes ? `Notes: ${notes}` : ''}`
            }
        })

        // Create Notification for User
        await prisma.notification.create({
            data: {
                userId: app.userId,
                title: 'Payment Verified',
                message: `Your payment of ${amount} ${currency || 'BDT'} has been manually verified by support.`,
                type: 'PAYMENT_VERIFIED',
                actionUrl: `/dashboard/individual/applications/${applicationId}`
            }
        })

        return NextResponse.json({ success: true, payment })

    } catch (error: any) {
        console.error('Create Payment Error:', error)
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.meta || error
        }, { status: 500 })
    }
}
