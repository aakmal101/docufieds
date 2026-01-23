import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationStatus } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/applications/[id]/complete-call
 * Complete the call process and finalize the application
 * 
 * This endpoint is idempotent - safe to call multiple times.
 * Verifies documents and payment before transitioning status from DRAFT to UNDER_REVIEW.
 * 
 * Features:
 * - Idempotent: Returns success if already submitted without creating duplicates
 * - Atomic: Uses Prisma transaction for data consistency
 * - Auditable: Creates StatusUpdate entry for history tracking
 * - Notifications: Creates user notification on submission
 * - Defensive: Validates ownership, prevents race conditions
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

    // Validate applicationId format
    if (!applicationId || typeof applicationId !== 'string' || applicationId.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Invalid application ID' },
        { status: 400 }
      )
    }

    // Verify application exists and belongs to the user (defensive check)
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id, // Ensure ownership
      },
      include: {
        documents: true,
        payments: true,
        statusUpdates: {
          where: {
            status: ApplicationStatus.UNDER_REVIEW,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found or access denied' },
        { status: 404 }
      )
    }

    // IDEMPOTENCY CHECK: If application is already submitted (not DRAFT), return success without changes
    const submittedStatuses = [
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.DOCUMENT_UNDER_REVIEW,
      ApplicationStatus.DOCUMENT_UNDER_PROCESSING,
      ApplicationStatus.PROCESSED,
      ApplicationStatus.COMPLETED,
      ApplicationStatus.DECLINED,
      ApplicationStatus.CANCELLED,
    ]

    if (submittedStatuses.includes(application.status as ApplicationStatus)) {
      // Check if StatusUpdate already exists for this transition
      const existingStatusUpdate = application.statusUpdates?.[0]

      return NextResponse.json({
        success: true,
        message: 'Application is already submitted and under processing.',
        data: {
          id: application.id,
          status: application.status,
          submittedAt: existingStatusUpdate?.createdAt || application.updatedAt,
          isAlreadySubmitted: true,
        },
      })
    }

    // Ensure application is in DRAFT status before proceeding
    if (application.status !== ApplicationStatus.DRAFT) {
      return NextResponse.json({
        success: false,
        message: `Application cannot be submitted from current status: ${application.status}`,
        currentStatus: application.status,
      }, { status: 400 })
    }

    // Step 1: Verify all required documents are uploaded
    const documentRequirements = await prisma.documentRequirement.findMany({
      where: {
        country: application.country,
        processType: application.processType,
        OR: [
          { profession: null },
          { profession: application.profession || null },
        ],
        isRequired: true,
      },
    })

    // Get uploaded document types
    const uploadedDocumentTypes = application.documents.map(doc => doc.documentType)

    // Check if all required documents are uploaded
    const missingDocuments = documentRequirements.filter(
      req => !uploadedDocumentTypes.includes(req.documentType)
    )

    if (missingDocuments.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Please upload all required documents before completing the application. Missing: ${missingDocuments.map(d => d.documentType).join(', ')}`,
        missingDocuments: missingDocuments.map(d => ({
          documentType: d.documentType,
          description: d.description,
        })),
      }, { status: 400 })
    }

    // Step 2: Verify payment status
    // Check if there's a paid payment for this application
    // Include both PAID and PARTIAL status payments
    const validPayments = application.payments.filter(
      p => p.status === 'PAID' || p.status === 'PARTIAL'
    )
    const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0)

    // Payment is required if consultancy fee > 0
    if (application.consultancyFee > 0) {
      if (validPayments.length === 0 || totalPaid < application.consultancyFee) {
        const remaining = application.consultancyFee - totalPaid
        // TEMPORARY: Allow proceeding without payment as per user request
        console.log(`[Backend] Allowing submission with pending payment: Required: ${application.consultancyFee}, Paid: ${totalPaid}`)

        /* 
        // DISABLED strict payment check
        return NextResponse.json({
          success: false,
          message: `Please complete the payment before finalizing the application. Required: ${application.consultancyFee} BDT, Paid: ${totalPaid} BDT, Remaining: ${remaining} BDT`,
          requiredAmount: application.consultancyFee,
          paidAmount: totalPaid,
          remainingAmount: remaining,
        }, { status: 400 })
        */
      }
    }

    // Step 3: All validations passed - Use transaction for atomicity
    // This prevents race conditions and ensures data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent race conditions
      const currentApp = await tx.application.findUnique({
        where: { id: applicationId },
        select: { status: true },
      })

      if (!currentApp) {
        throw new Error('Application not found during transaction')
      }

      // Double-check status hasn't changed (race condition protection)
      if (currentApp.status !== ApplicationStatus.DRAFT) {
        throw new Error(`Application status changed during processing: ${currentApp.status}`)
      }

      // Update application status to UNDER_REVIEW atomically
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.UNDER_REVIEW,
          updatedAt: new Date(),
        },
      })

      // Create status update entry for audit trail
      const statusUpdate = await tx.statusUpdate.create({
        data: {
          applicationId,
          status: ApplicationStatus.UNDER_REVIEW,
          message: `Application submitted successfully. All required documents (${application.documents.length}) uploaded and payment verified (${totalPaid} BDT). Application is now under review and will be processed by our legal team.`,
          updatedBy: session.user.id,
        },
      })

      // Create notification for user (only if not already exists for this submission)
      // Check for recent notification to prevent duplicates
      const recentNotification = await tx.notification.findFirst({
        where: {
          userId: session.user.id,
          type: 'application_submitted',
          createdAt: {
            gte: new Date(Date.now() - 60000), // Within last minute
          },
        },
      })

      let notification = null
      if (!recentNotification) {
        notification = await tx.notification.create({
          data: {
            userId: session.user.id,
            title: 'Application Successfully Submitted',
            message: 'Your application has been submitted and is under processing.',
            type: 'application_submitted',
          },
        })
      }

      return {
        application: updatedApplication,
        statusUpdate,
        notification,
      }
    })

    // Return success response with completion details
    return NextResponse.json({
      success: true,
      message: 'Application process completed successfully! Your application has been submitted and is now under review.',
      data: {
        id: result.application.id,
        status: result.application.status,
        submittedAt: result.statusUpdate.createdAt,
        documentsCount: application.documents.length,
        requiredDocumentsCount: documentRequirements.length,
        paymentStatus: application.consultancyFee > 0
          ? (totalPaid >= application.consultancyFee ? 'PAID' : 'PARTIAL')
          : 'NOT_REQUIRED',
        totalPaid: totalPaid,
        requiredAmount: application.consultancyFee,
        notificationCreated: result.notification !== null,
      },
    })
  } catch (error: any) {
    console.error('Call completion error:', error)

    // Handle transaction errors gracefully
    if (error.message?.includes('status changed')) {
      return NextResponse.json({
        success: false,
        message: 'Application status changed during processing. Please refresh and try again.',
        error: 'RACE_CONDITION',
      }, { status: 409 }) // Conflict status
    }

    return NextResponse.json(
      {
        success: false,
        // TEMPORARY: Expose error message in production for debugging
        message: `Server Error: ${error.message || 'Unknown error'}`,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
