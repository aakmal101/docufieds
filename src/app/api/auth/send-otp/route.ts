import { NextRequest, NextResponse } from 'next/server'
import { sendOTP } from '@/lib/otp'
import { validateEmail, validatePhone } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json()

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, message: 'Phone or email is required' },
        { status: 400 }
      )
    }

    // Validate phone or email format
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await sendOTP(phone, email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        expiresIn: result.expiresIn,
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}