import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/documents/[id]
 * Get a single document by ID
 * Accessible by: Document owner, ADMIN, SUPPORT, LEGAL, ACCOUNTS, CASH_OFFICER
 */
export async function GET(
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
    const documentId = resolvedParams.id

    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          application: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      })

      if (!document) {
        return NextResponse.json(
          { success: false, message: 'Document not found' },
          { status: 404 }
        )
      }

      // Check if user has access
      const adminRoles = ['ADMIN', 'SUPPORT', 'LEGAL', 'ACCOUNTS', 'CASH_OFFICER']
      const isAdmin = adminRoles.includes(session.user.role)
      const isOwner = document.userId === session.user.id
      const isApplicationOwner = document.application.userId === session.user.id

      if (!isAdmin && !isOwner && !isApplicationOwner) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          id: document.id,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          fileType: document.fileType,
          fileSize: document.fileSize,
          documentType: document.documentType,
          isRequired: document.isRequired,
          uploadedAt: document.uploadedAt,
          applicationId: document.applicationId,
        },
      })
    } catch (prismaError: any) {
      console.error('Prisma error fetching document:', prismaError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch document' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Document fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
