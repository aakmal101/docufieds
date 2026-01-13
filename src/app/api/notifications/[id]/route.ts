import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession which requires headers/cookies
export const dynamic = 'force-dynamic'

export async function DELETE(
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

    const notification = await prisma.notification.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (notification.count === 0) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}














