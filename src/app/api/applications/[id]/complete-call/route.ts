import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/applications/[id]/complete-call
 * Complete the call process and finalize the application
 * Verifies documents and payment before completion
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
      include: {
        documents: true,
        payments: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if application is already completed
    if (application.status === 'UNDER_REVIEW' || application.status === 'DOCUMENT_UNDER_REVIEW') {
      return NextResponse.json({
        success: true,
        message: 'Application is already submitted and under review.',
        data: application,
      })
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
        return NextResponse.json({
          success: false,
          message: `Please complete the payment before finalizing the application. Required: ${application.consultancyFee} BDT, Paid: ${totalPaid} BDT, Remaining: ${remaining} BDT`,
          requiredAmount: application.consultancyFee,
          paidAmount: totalPaid,
          remainingAmount: remaining,
        }, { status: 400 })
      }
    }

    // Step 3: All validations passed - Complete the application
    // Update application status to UNDER_REVIEW (submitted and ready for legal team processing)
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { 
        status: 'UNDER_REVIEW',
        updatedAt: new Date(),
      },
    })

    // Create comprehensive status update
    await prisma.statusUpdate.create({
      data: {
        applicationId,
        status: 'UNDER_REVIEW',
        message: `Application process completed successfully. All required documents (${application.documents.length}) uploaded and payment verified. Application is now submitted and ready for processing by legal team.`,
        updatedBy: session.user.id,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Application Successfully Submitted',
        message: `Your application for ${application.country} (${application.processType}) has been successfully submitted. All documents have been verified and payment confirmed. Your application is now under review and will be processed by our legal team.`,
        type: 'application_update',
      },
    })

    // Return success response with completion details
    return NextResponse.json({
      success: true,
      message: 'Application process completed successfully! Your application has been submitted and is now under review.',
      data: {
        ...updatedApplication,
        documentsCount: application.documents.length,
        requiredDocumentsCount: documentRequirements.length,
        paymentStatus: application.consultancyFee > 0 
          ? (totalPaid >= application.consultancyFee ? 'PAID' : 'PARTIAL')
          : 'NOT_REQUIRED',
        totalPaid: totalPaid,
        requiredAmount: application.consultancyFee,
      },
    })
  } catch (error: any) {
    console.error('Call completion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
