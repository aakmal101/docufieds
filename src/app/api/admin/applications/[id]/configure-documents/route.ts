import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getCurrentUser which requires headers/cookies
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has support privileges
    if (user!.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { documentRequirements, requirementsWithModules } = await request.json()
    const applicationId = params.id

    // Support both legacy (string[]) and new ({documentType, module}[]) formats
    const hasLegacyData = documentRequirements && Array.isArray(documentRequirements) && documentRequirements.length > 0
    const hasNewData = requirementsWithModules && Array.isArray(requirementsWithModules) && requirementsWithModules.length > 0

    if (!hasLegacyData && !hasNewData) {
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

    const newRequirements = []

    // Process legacy data (global scope)
    if (hasLegacyData) {
      newRequirements.push(...documentRequirements.map((docType: string) => ({
        documentType: docType,
        module: null
      })))
    }

    // Process new data
    if (hasNewData) {
      newRequirements.push(...requirementsWithModules)
    }

    // Create document requirements
    const documentRequirementPromises = newRequirements.map((req) =>
      prisma.documentRequirement.create({
        data: {
          country: application.country,
          processType: application.processType,
          profession: application.profession,
          documentType: req.documentType,
          module: req.module || null,
          isRequired: true,
          description: `Required document for ${application.country} ${application.processType} application${req.module ? ` (${req.module} Module)` : ''}`,
        } as any, // Cast to any to avoid type error until generation update propagates
      })
    )

    await Promise.all(documentRequirementPromises)

    // Create status update
    const docList = newRequirements.map(r => r.module ? `${r.documentType} (${r.module})` : r.documentType).join(', ')

    await prisma.applicationStatusUpdate.create({
      data: {
        applicationId,
        toStatus: 'DOCUMENT_UNDER_REVIEW',
        fromStatus: application.status,
        changedByType: 'SUPPORT_MEMBER',
        changedById: user!.id, // Assuming support user is logged in
        // Note: The schema for ApplicationStatusUpdate is different from what was here.
        // Schema has: fromStatus, toStatus, changedByType, changedById, changedByMemberId, notes, isVisibleToUser
        // The old code had: status, message, updatedBy
        // adjusting to match schema:
        notes: `Document requirements configured by support team. Required documents: ${docList}`,
        isVisibleToUser: true
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: 'Document Requirements Updated',
        message: `Your application document requirements have been configured. Please upload the required documents.`,
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