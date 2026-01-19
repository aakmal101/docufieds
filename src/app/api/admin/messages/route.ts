import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/messages
 * Get messages for an application or user
 * Query params: applicationId, userId
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

    // Check if user has admin/support privileges
    const allowedRoles = ['ADMIN', 'SUPPORT']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const userId = searchParams.get('userId')

    if (!applicationId && !userId) {
      return NextResponse.json(
        { success: false, message: 'applicationId or userId is required' },
        { status: 400 }
      )
    }

    const where: any = {}
    if (applicationId) {
      where.applicationId = applicationId
    }
    if (userId) {
      where.userId = userId
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        application: {
          select: {
            id: true,
            country: true,
            processType: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/messages
 * Send a message from support/admin to user
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { applicationId, userId, text } = body

    if (!userId || !text || !text.trim()) {
      return NextResponse.json(
        { success: false, message: 'userId and text are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // If applicationId provided, verify it exists and belongs to user
    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId: userId,
        },
      })

      if (!application) {
        return NextResponse.json(
          { success: false, message: 'Application not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        applicationId: applicationId || null,
        userId,
        senderId: session.user.id,
        senderRole: session.user.role,
        text: text.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        application: {
          select: {
            id: true,
            country: true,
            processType: true,
            status: true,
          },
        },
      },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        title: 'New Message from Support',
        message: `You have a new message from our support team${applicationId ? ' regarding your application' : ''}.`,
        type: 'message',
      },
    })

    return NextResponse.json({
      success: true,
      data: message,
    })
  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
