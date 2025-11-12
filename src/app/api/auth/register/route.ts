import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMemberId } from '@/lib/utils'
import { UserRole } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const {
      fullName,
      phone,
      email,
      dateOfBirth,
      placeOfBirth,
      role,
      agencyName,
      agencyLicense,
    } = await request.json()

    // Validate required fields
    if (!fullName || !phone || !dateOfBirth || !placeOfBirth || !role) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this phone or email already exists' },
        { status: 409 }
      )
    }

    // Generate member ID for approved users
    const memberId = role === UserRole.INDIVIDUAL ? generateMemberId() : undefined

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email: email || null,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        role: role as UserRole,
        memberId,
        agencyName: role === UserRole.AGENCY ? agencyName : null,
        agencyLicense: role === UserRole.AGENCY ? agencyLicense : null,
        status: role === UserRole.INDIVIDUAL ? 'PENDING' : 'APPROVED',
        isVerified: true, // Auto-verify for development
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: { userId: user.id },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
