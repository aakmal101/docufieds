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

    // Check if user has support privileges
    if (session.user.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { documentRequirements } = await request.json()
    const applicationId = params.id

    if (!documentRequirements || !Array.isArray(documentRequirements)) {
      return NextResponse.json(
        { success: false, message: 'Document requirements are required' },
        { status: 400 }
      )
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

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'DOCUMENT_UNDER_REVIEW' },
    })

    // Create document requirements
    const documentRequirementPromises = documentRequirements.map((docType) =>
      prisma.documentRequirement.create({
        data: {
          country: application.country,
          processType: application.processType,
          profession: application.profession,
          documentType: docType,
          isRequired: true,
          description: `Required document for ${application.country} ${application.processType} application`,
        },
      })
    )

    await Promise.all(documentRequirementPromises)

    // Create status update
    await prisma.statusUpdate.create({
      data: {
        applicationId,
        status: 'DOCUMENT_UNDER_REVIEW',
        message: `Document requirements configured by support team. Required documents: ${documentRequirements.join(', ')}`,
        updatedBy: session.user.id,
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: 'Document Requirements Updated',
        message: `Your application document requirements have been configured. Please upload the required documents: ${documentRequirements.join(', ')}`,
        type: 'document_requirements',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Document requirements configured successfully',
      data: updatedApplication,
    })
  } catch (error) {
    console.error('Document configuration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}