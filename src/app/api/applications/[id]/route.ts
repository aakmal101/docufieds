import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/applications/[id]
 * Get a single application by ID
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
    const applicationId = resolvedParams.id

    try {
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId: session.user.id,
        },
        include: {
          documents: {
            select: {
              id: true,
              fileName: true,
              documentType: true,
              uploadedAt: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              paidAt: true,
            },
          },
        },
      })

      if (!application) {
        return NextResponse.json(
          { success: false, message: 'Application not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: application,
      })
    } catch (prismaError: any) {
      console.warn('Prisma connection failed:', prismaError.message)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch application' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Application fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
