import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/otp'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { identifier, otp } = await request.json()

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, message: 'Identifier and OTP are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(identifier, otp)

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Find user by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Registration verified successfully',
      data: {
        userId: updatedUser.id,
        isVerified: updatedUser.isVerified,
      },
    })
  } catch (error) {
    console.error('Verify registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}