import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/applications/[id]/complete-call
 * Complete the call process and update application status to UNDER_REVIEW
 */
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

    // Handle both Promise and direct params (Next.js 14+ vs older versions)
    const resolvedParams = params instanceof Promise ? await params : params
    const applicationId = resolvedParams.id

    // Verify application exists and belongs to the user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application status to UNDER_REVIEW (submitted and ready for processing)
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'UNDER_REVIEW' },
    })

    // Create status update
    await prisma.statusUpdate.create({
      data: {
        applicationId,
        status: 'UNDER_REVIEW',
        message: 'Call process completed. Application submitted and ready for processing by legal team.',
        updatedBy: session.user.id,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Application Submitted',
        message: 'Your application call process has been completed. Your application is now under review and will be processed by our legal team.',
        type: 'application_update',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Call process completed successfully. Application is now under review.',
      data: updatedApplication,
    })
  } catch (error: any) {
    console.error('Call completion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
