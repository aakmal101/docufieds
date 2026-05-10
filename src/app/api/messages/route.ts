import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages
 * Get messages for the current user
 * Query params: applicationId
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')

    const where: any = {
      userId: user!.id,
    }
    
    if (applicationId) {
      where.applicationId = applicationId
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
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
 * POST /api/messages
 * Send a message from user to support
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { applicationId, text, chatType = 'support' } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message text is required' },
        { status: 400 }
      )
    }

    // If applicationId provided, verify it belongs to user
    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId: user!.id,
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
        userId: user!.id,
        senderId: user!.id,
        senderRole: user!.role || 'INDIVIDUAL',
        text: text.trim(),
      },
      include: {
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
