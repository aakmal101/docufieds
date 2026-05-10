import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { generateMemberId } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
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
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      fullName,
      email,
      dateOfBirth,
      placeOfBirth,
      birthCertificateNumber,
      nidNumber,
      passportNumber,
      presentAddress,
      permanentAddress,
      photoUrl
    } = body

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      if (email.trim() !== user.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: email.trim() },
        })
        if (emailExists) {
          return NextResponse.json(
            { success: false, message: 'Email address is already in use' },
            { status: 409 }
          )
        }
      }
    }

    if (!fullName || !dateOfBirth || !placeOfBirth || !birthCertificateNumber ||
      !nidNumber || !passportNumber || !presentAddress || !permanentAddress) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const names = fullName.split(' ')
    const firstName = names[0]
    const lastName = names.slice(1).join(' ') || ''

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email && email.trim() !== '' ? email.trim() : user.email,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        birthCertificateNumber,
        nidNumber,
        presentAddress,
        permanentAddress,
        photoUrl: photoUrl || user.photoUrl,
        status: 'APPROVED',
        individualProfile: {
          upsert: {
            create: {
              firstName,
              lastName,
              passportNumber,
            },
            update: {
              firstName,
              lastName,
              passportNumber,
            }
          }
        }
      },
      include: {
        individualProfile: true,
        agencyProfile: true,
        supportProfile: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
      autoLogin: false,
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, phone, fullName } = body

    if (email !== undefined && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      if (email.trim() !== user.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: email.trim() },
        })
        if (emailExists) {
          return NextResponse.json(
            { success: false, message: 'Email address is already in use' },
            { status: 409 }
          )
        }
      }
    }

    let individualProfileUpdate: any = undefined
    if (fullName !== undefined || phone !== undefined) {
      individualProfileUpdate = { upsert: { create: {}, update: {} } }
      if (fullName !== undefined) {
        const names = fullName.split(' ')
        individualProfileUpdate.upsert.create.firstName = names[0]
        individualProfileUpdate.upsert.update.firstName = names[0]
        individualProfileUpdate.upsert.create.lastName = names.slice(1).join(' ') || ''
        individualProfileUpdate.upsert.update.lastName = names.slice(1).join(' ') || ''
      }
      if (phone !== undefined) {
        individualProfileUpdate.upsert.create.phoneNumber = phone
        individualProfileUpdate.upsert.update.phoneNumber = phone
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(email !== undefined && { email: email.trim() !== '' ? email.trim() : null }),
        ...(individualProfileUpdate && { individualProfile: individualProfileUpdate })
      },
      include: {
        individualProfile: true,
        agencyProfile: true,
        supportProfile: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account information updated successfully',
      data: updatedUser
    })
  } catch (error: any) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
