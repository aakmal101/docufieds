import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check role - simplified for now, assuming any logged in user on this route is authorized via middleware/page protection
    // In production, check session.user.role === 'SUPPORT' || 'ADMIN'

    const resolvedParams = params instanceof Promise ? await params : params
    const applicationId = resolvedParams.id

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application last activity
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        lastActivityAt: new Date(),
      },
    })

    // Log the callback as a status update
    // Using 'any' cast as we know schema updated but types might lag
    await (prisma as any).applicationStatusUpdate.create({
      data: {
        applicationId,
        fromStatus: application.status,
        toStatus: application.status,
        changedByType: 'SUPPORT_MEMBER',
        changedByMemberId: session.user.memberId || session.user.id, // Use memberId if available
        notes: 'Callback completed with user.',
        isVisibleToUser: false
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Callback marked as complete',
    })
  } catch (error: any) {
    console.error('Error marking callback complete:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}