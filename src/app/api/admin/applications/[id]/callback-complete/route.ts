import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession which requires headers/cookies
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin/support privileges
    const allowedRoles = ['ADMIN', 'SUPPORT']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const applicationId = params.id

    // Get request body for admin notes (handle empty body gracefully)
    let adminNote = ''
    try {
      const body = await request.json()
      adminNote = body.adminNote || body.note || ''
    } catch {
      // Request body is empty or invalid, that's okay
      adminNote = ''
    }

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

    // Only update status if currently UNDER_REVIEW
    let updatedApplication = application
    let statusMessage = 'Customer callback completed.'
    
    if (application.status === 'UNDER_REVIEW') {
      updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'DOCUMENT_UNDER_REVIEW' },
      })
      statusMessage = 'Customer callback completed. Application moved to document review stage.'
    }

    // Create status update with admin note
    const statusUpdateMessage = adminNote
      ? `${statusMessage} Admin note: ${adminNote}`
      : statusMessage

    await prisma.statusUpdate.create({
      data: {
        applicationId,
        status: updatedApplication.status,
        message: statusUpdateMessage,
        updatedBy: session.user.id,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: 'Callback Completed',
        message: 'Your application callback has been completed. Please check your document requirements and upload the necessary documents.',
        type: 'application_update',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Callback completed successfully',
      data: {
        ...updatedApplication,
        adminNote: adminNote || null,
      },
    })
  } catch (error) {
    console.error('Callback completion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}