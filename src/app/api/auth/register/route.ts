import { NextRequest, NextResponse } from 'next/server'
import { syncUserWithPrisma } from '@/lib/supabase/auth'

/**
 * POST /api/auth/register
 *
 * Called by the signup page immediately after supabase.auth.signUp() succeeds.
 * Receives the Supabase user ID, email, and the full user_metadata object,
 * then delegates to syncUserWithPrisma to create the Prisma User record
 * BEFORE the client-side redirect.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supabaseUserId, email, metadata } = body

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: 'supabaseUserId is required' },
        { status: 400 },
      )
    }

    const user = await syncUserWithPrisma(supabaseUserId, email, metadata)

    return NextResponse.json({
      success: true,
      userId: user.id,
      role: user.role,
    })
  } catch (error: any) {
    console.error('[POST /api/auth/register] Prisma sync failed:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create user record' },
      { status: 500 },
    )
  }
}
