import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
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

    // Generate member ID for approved users
    const memberId = role === UserRole.INDIVIDUAL ? generateMemberId() : undefined

    // Try Prisma first, fallback to Supabase
    try {
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

      // Create user with Prisma
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
          isVerified: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        data: { 
          userId: user.id,
          memberId: user.memberId,
          role: user.role,
        },
      })
    } catch (prismaError: any) {
      console.warn('Prisma registration failed, trying Supabase fallback:', prismaError.message)
      
      // Fallback to Supabase
      try {
        const supabase = createServiceRoleClient()
        
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .or(`phone.eq.${phone}${email ? `,email.eq.${email}` : ''}`)
          .single()

        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'User with this phone or email already exists' },
            { status: 409 }
          )
        }

        // Create user with Supabase
        const { data: user, error: supabaseError } = await supabase
          .from('users')
          .insert({
            full_name: fullName,
            phone,
            email: email || null,
            date_of_birth: new Date(dateOfBirth).toISOString(),
            place_of_birth: placeOfBirth,
            role: role,
            member_id: memberId,
            agency_name: role === UserRole.AGENCY ? agencyName : null,
            agency_license: role === UserRole.AGENCY ? agencyLicense : null,
            status: role === UserRole.INDIVIDUAL ? 'PENDING' : 'APPROVED',
            is_verified: true,
          })
          .select()
          .single()

        if (supabaseError) {
          throw supabaseError
        }

        return NextResponse.json({
          success: true,
          message: 'User registered successfully',
          data: { 
            userId: user.id,
            memberId: user.member_id,
            role: user.role,
          },
        })
      } catch (supabaseError: any) {
        console.error('Supabase registration also failed:', supabaseError)
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to register user. Please try again.',
            error: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
          },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error)
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
