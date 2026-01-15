import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession
export const dynamic = 'force-dynamic'

export async function GET(
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

    const applicationId = params.id

    // Verify application exists and belongs to user
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

    // Fetch document requirements for this application
    const requirements = await prisma.documentRequirement.findMany({
      where: {
          country: application.country,
          processType: application.processType,
          OR: [
            { profession: null },
            { profession: application.profession || null },
          ],
        },
      orderBy: {
        isRequired: 'desc',
      },
    })

    // Fetch uploaded documents for this application
    const uploadedDocuments = await prisma.document.findMany({
      where: {
        applicationId: applicationId,
      },
      select: {
        documentType: true,
        fileUrl: true,
        fileName: true,
        uploadedAt: true,
      },
    })

    // Map requirements with upload status
    const requirementsWithStatus = requirements.map((req) => {
      const uploadedDoc = uploadedDocuments.find(
        (doc) => doc.documentType === req.documentType
      )
      return {
        ...req,
        status: uploadedDoc ? 'uploaded' : 'pending',
        uploadedFile: uploadedDoc || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: requirementsWithStatus,
    })
  } catch (error) {
    console.error('Error fetching document requirements:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
