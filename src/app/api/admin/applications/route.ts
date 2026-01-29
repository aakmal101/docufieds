import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession which requires headers/cookies
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    const adminRoles = ['ADMIN', 'SUPPORT', 'LEGAL', 'ACCOUNTS', 'CASH_OFFICER']
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const submittedOnly = searchParams.get('submittedOnly') === 'true'

    // Define submitted statuses (status >= UNDER_REVIEW)
    const submittedStatuses = [
      'UNDER_REVIEW',
      'DOCUMENT_UNDER_REVIEW',
      'DOCUMENT_UNDER_PROCESSING',
      'PROCESSED',
      'COMPLETED',
      'DECLINED',
      'CANCELLED',
    ]

    const where: any = {}

    // Filter by submitted statuses if requested
    if (submittedOnly) {
      where.status = {
        in: submittedStatuses,
      }
    } else if (statusFilter) {
      where.status = statusFilter
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            memberId: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            documentType: true,
            uploadedAt: true,
            isRequired: true,
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
        statusUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: applications,
    })
  } catch (error) {
    console.error('Admin applications fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}