import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession which requires headers/cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to fetch from database
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          userId: true,
          role: true,
          status: true,
          memberId: true,
          dateOfBirth: true,
          placeOfBirth: true,
          photoUrl: true,
          birthCertificateNumber: true,
          nidNumber: true,
          passportNumber: true,
          presentAddress: true,
          permanentAddress: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (user) {
        return NextResponse.json({
          success: true,
          data: user,
        })
      }
    } catch (prismaError: any) {
      console.warn('Prisma connection failed, using session data:', prismaError.message)
    }

    // Fallback to session data if database is unavailable
    const userData = {
      id: session.user.id,
      fullName: session.user.fullName || 'Individual User',
      email: session.user.email || session.user.id,
      phone: session.user.phone || '+1234567890',
      userId: session.user.userId || null,
      role: session.user.role || 'INDIVIDUAL',
      status: session.user.status || 'PENDING',
      memberId: session.user.memberId || null,
      dateOfBirth: null,
      placeOfBirth: null,
      photoUrl: null,
      birthCertificateNumber: null,
      nidNumber: null,
      passportNumber: null,
      presentAddress: null,
      permanentAddress: null,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      fullName,
      dateOfBirth,
      placeOfBirth,
      birthCertificateNumber,
      nidNumber,
      passportNumber,
      presentAddress,
      permanentAddress,
      photoUrl
    } = body

    // Validate required fields
    if (!fullName || !dateOfBirth || !placeOfBirth || !birthCertificateNumber || 
        !nidNumber || !passportNumber || !presentAddress || !permanentAddress) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        birthCertificateNumber,
        nidNumber,
        passportNumber,
        presentAddress,
        permanentAddress,
        photoUrl: photoUrl || null,
        status: 'APPROVED', // Auto-approve when profile is complete
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        userId: true,
        role: true,
        status: true,
        memberId: true,
        dateOfBirth: true,
        placeOfBirth: true,
        photoUrl: true,
        birthCertificateNumber: true,
        nidNumber: true,
        passportNumber: true,
        presentAddress: true,
        permanentAddress: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
