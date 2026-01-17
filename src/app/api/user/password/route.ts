import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createServiceRoleClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/user/password
 * Check if user has a password set
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

    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          passwordHash: true,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          hasPassword: !!user?.passwordHash,
        },
      })
    } catch (prismaError: any) {
      // Fallback to Supabase
      try {
        const supabase = createServiceRoleClient()
        const { data: user } = await supabase
          .from('users')
          .select('password_hash')
          .eq('id', session.user.id)
          .single()

        return NextResponse.json({
          success: true,
          data: {
            hasPassword: !!user?.password_hash,
          },
        })
      } catch (supabaseError: any) {
        return NextResponse.json(
          { success: false, message: 'Failed to check password status' },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Password check error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/password
 * Set or update user password
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

    const { password, currentPassword } = await request.json()

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    try {
      // Check if user has existing password (for update)
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          passwordHash: true,
        },
      })

      // If updating password, verify current password
      if (existingUser?.passwordHash && currentPassword) {
        const isValidPassword = await bcrypt.compare(
          currentPassword,
          existingUser.passwordHash
        )

        if (!isValidPassword) {
          return NextResponse.json(
            { success: false, message: 'Current password is incorrect' },
            { status: 400 }
          )
        }
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10)

      // Update password
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          phone: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: existingUser?.passwordHash 
          ? 'Password updated successfully'
          : 'Password set successfully',
        data: updatedUser,
      })
    } catch (prismaError: any) {
      console.warn('Prisma password update failed, trying Supabase fallback:', prismaError.message)
      
      // Fallback to Supabase
      try {
        const supabase = createServiceRoleClient()
        
        // Check if user has existing password
        const { data: existingUser } = await supabase
          .from('users')
          .select('password_hash')
          .eq('id', session.user.id)
          .single()

        // If updating password, verify current password
        if (existingUser?.password_hash && currentPassword) {
          const isValidPassword = await bcrypt.compare(
            currentPassword,
            existingUser.password_hash
          )

          if (!isValidPassword) {
            return NextResponse.json(
              { success: false, message: 'Current password is incorrect' },
              { status: 400 }
            )
          }
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10)

        // Update password
        const { data: updatedUser, error: supabaseError } = await supabase
          .from('users')
          .update({
            password_hash: passwordHash,
          })
          .eq('id', session.user.id)
          .select('id, email, phone')
          .single()

        if (supabaseError) {
          throw supabaseError
        }

        return NextResponse.json({
          success: true,
          message: existingUser?.password_hash 
            ? 'Password updated successfully'
            : 'Password set successfully',
          data: updatedUser,
        })
      } catch (supabaseError: any) {
        console.error('Supabase password update also failed:', supabaseError)
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to update password. Please try again.',
            error: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
          },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Password update error:', error)
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
