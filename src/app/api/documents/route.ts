import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/documents?applicationId={id}
 * Get documents for an application
 * Accessible by: Application owner, ADMIN, SUPPORT, LEGAL, ACCOUNTS, CASH_OFFICER
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')

    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if user has access
    const adminRoles = ['ADMIN', 'SUPPORT', 'LEGAL', 'ACCOUNTS', 'CASH_OFFICER']
    const isAdmin = adminRoles.includes(session.user.role)
    const isOwner = application.userId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch documents
    try {
      const documents = await prisma.document.findMany({
        where: {
          applicationId,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          fileType: true,
          fileSize: true,
          documentType: true,
          isRequired: true,
          uploadedAt: true,
        },
      })

      return NextResponse.json({
        success: true,
        data: documents,
      })
    } catch (prismaError: any) {
      console.error('Prisma error fetching documents:', prismaError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch documents' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
