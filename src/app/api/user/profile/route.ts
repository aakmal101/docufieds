import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { generateMemberId } from '@/lib/utils'

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
      console.warn('Prisma connection failed, trying Supabase fallback:', prismaError.message)
      
      // Fallback to Supabase
      try {
        const supabase = await createClient()
        const { data: user, error: supabaseError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!supabaseError && user) {
          // Transform Supabase response to match Prisma format
          const transformedUser = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            userId: user.user_id,
            role: user.role,
            status: user.status,
            memberId: user.member_id,
            dateOfBirth: user.date_of_birth,
            placeOfBirth: user.place_of_birth,
            photoUrl: user.photo_url,
            birthCertificateNumber: user.birth_certificate_number,
            nidNumber: user.nid_number,
            passportNumber: user.passport_number,
            presentAddress: user.present_address,
            permanentAddress: user.permanent_address,
            isVerified: user.is_verified,
            passwordHash: user.password_hash || null,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          }
          
          return NextResponse.json({
            success: true,
            data: transformedUser,
          })
        }
      } catch (supabaseError: any) {
        console.warn('Supabase fetch also failed, using session data:', supabaseError.message)
      }
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

    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!fullName || !dateOfBirth || !placeOfBirth || !birthCertificateNumber || 
        !nidNumber || !passportNumber || !presentAddress || !permanentAddress) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Try Prisma first, fallback to Supabase if it fails
    try {
      // Check if user exists first
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      if (!existingUser) {
        // Check email uniqueness if email is provided
        if (email && email.trim() !== '') {
          const emailExists = await prisma.user.findUnique({
            where: { email: email.trim() },
          })
          if (emailExists && emailExists.id !== session.user.id) {
            return NextResponse.json(
              { success: false, message: 'Email address is already in use' },
              { status: 409 }
            )
          }
        }

        // User doesn't exist, create it
        const newUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: email && email.trim() !== '' ? email.trim() : (session.user.email || null),
            phone: session.user.phone || null,
            userId: session.user.userId || null,
            fullName,
            dateOfBirth: new Date(dateOfBirth),
            placeOfBirth,
            birthCertificateNumber,
            nidNumber,
            passportNumber,
            presentAddress,
            permanentAddress,
            photoUrl: photoUrl || null,
            role: session.user.role || 'INDIVIDUAL',
            status: 'APPROVED',
            memberId: session.user.memberId || generateMemberId(),
            isVerified: true,
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
            passwordHash: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        // Auto-login after profile creation
        return NextResponse.json({
          success: true,
          message: 'Profile created and saved successfully. You are now registered!',
          data: newUser,
          autoLogin: true,
        })
      }

      // Check email uniqueness if email is being updated
      if (email && email.trim() !== '' && email.trim() !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: email.trim() },
        })
        if (emailExists && emailExists.id !== session.user.id) {
          return NextResponse.json(
            { success: false, message: 'Email address is already in use' },
            { status: 409 }
          )
        }
      }

      // User exists, update it
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          fullName,
          email: email && email.trim() !== '' ? email.trim() : existingUser.email,
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

        // If user was just created, mark for auto-login
        const wasJustCreated = !existingUser
        
        return NextResponse.json({
          success: true,
          message: wasJustCreated 
            ? 'Profile created and saved successfully. You are now registered!'
            : 'Profile updated successfully',
          data: updatedUser,
          autoLogin: wasJustCreated,
        })
    } catch (prismaError: any) {
      console.warn('Prisma update failed, trying Supabase fallback:', prismaError.message)
      
      // Fallback to Supabase - use service role client to bypass RLS if needed
      try {
        const supabase = createServiceRoleClient()
        
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        let updatedUser

        if (!existingUser) {
          // Check email uniqueness if email is provided
          if (email && email.trim() !== '') {
            const { data: emailExists } = await supabase
              .from('users')
              .select('id')
              .eq('email', email.trim())
              .single()
            
            if (emailExists && emailExists.id !== session.user.id) {
              return NextResponse.json(
                { success: false, message: 'Email address is already in use' },
                { status: 409 }
              )
            }
          }

          // User doesn't exist, create it
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: email && email.trim() !== '' ? email.trim() : (session.user.email || null),
              phone: session.user.phone || null,
              user_id: session.user.userId || null,
              full_name: fullName,
              date_of_birth: new Date(dateOfBirth).toISOString(),
              place_of_birth: placeOfBirth,
              birth_certificate_number: birthCertificateNumber,
              nid_number: nidNumber,
              passport_number: passportNumber,
              present_address: presentAddress,
              permanent_address: permanentAddress,
              photo_url: photoUrl || null,
              role: session.user.role || 'INDIVIDUAL',
              status: 'APPROVED',
              member_id: session.user.memberId || generateMemberId(),
              is_verified: true,
            })
            .select()
            .single()

          if (createError) {
            throw createError
          }

          updatedUser = newUser
        } else {
          // Check email uniqueness if email is being updated
          if (email && email.trim() !== '') {
            const { data: currentUser } = await supabase
              .from('users')
              .select('email')
              .eq('id', session.user.id)
              .single()
            
            if (email.trim() !== currentUser?.email) {
              const { data: emailExists } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.trim())
                .single()
              
              if (emailExists && emailExists.id !== session.user.id) {
                return NextResponse.json(
                  { success: false, message: 'Email address is already in use' },
                  { status: 409 }
                )
              }
            }
          }

          // Get current user email
          const { data: currentUser } = await supabase
            .from('users')
            .select('email')
            .eq('id', session.user.id)
            .single()

          // Prepare update data
          const updateData: any = {
            full_name: fullName,
            date_of_birth: new Date(dateOfBirth).toISOString(),
            place_of_birth: placeOfBirth,
            birth_certificate_number: birthCertificateNumber,
            nid_number: nidNumber,
            passport_number: passportNumber,
            present_address: presentAddress,
            permanent_address: permanentAddress,
            photo_url: photoUrl || null,
            status: 'APPROVED',
            updated_at: new Date().toISOString(),
          }

          // Only update email if a new one is provided
          if (email && email.trim() !== '') {
            updateData.email = email.trim()
          }

          // User exists, update it
          const { data: updated, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', session.user.id)
            .select()
            .single()

          if (updateError) {
            throw updateError
          }

          updatedUser = updated
        }

        // Transform Supabase response to match Prisma format
        const transformedUser = {
          id: updatedUser.id,
          fullName: updatedUser.full_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          userId: updatedUser.user_id,
          role: updatedUser.role,
          status: updatedUser.status,
          memberId: updatedUser.member_id,
          dateOfBirth: updatedUser.date_of_birth,
          placeOfBirth: updatedUser.place_of_birth,
          photoUrl: updatedUser.photo_url,
          birthCertificateNumber: updatedUser.birth_certificate_number,
          nidNumber: updatedUser.nid_number,
          passportNumber: updatedUser.passport_number,
          presentAddress: updatedUser.present_address,
          permanentAddress: updatedUser.permanent_address,
          isVerified: updatedUser.is_verified,
          passwordHash: updatedUser.password_hash || null,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at,
        }

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          data: transformedUser,
        })
      } catch (supabaseError: any) {
        console.error('Supabase update also failed:', supabaseError)
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to update profile. Please check your database connection.',
            error: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
          },
          { status: 500 }
        )
      }
    }
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
