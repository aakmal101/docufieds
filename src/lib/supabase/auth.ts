import { createClient } from './server'
import { prisma } from '../prisma'

/**
 * Sync Supabase Auth user with Prisma User
 * This ensures your Prisma User table stays in sync with Supabase Auth
 */
export async function syncUserWithPrisma(supabaseUserId: string, email?: string, phone?: string) {
  try {
    // Check if user exists in Prisma
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    })

    // If user doesn't exist, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          userId: supabaseUserId,
          role: 'INDIVIDUAL',
          status: 'PENDING',
          isVerified: true,
        },
      })
    } else {
      // Update user if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          userId: supabaseUserId,
          isVerified: true,
        },
      })
    }

    return user
  } catch (error) {
    console.error('Error syncing user with Prisma:', error)
    throw error
  }
}

/**
 * Get or create user from Supabase Auth session
 */
export async function getUserFromSession() {
  const supabase = await createClient()
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

  if (error || !supabaseUser) {
    return null
  }

  // Sync with Prisma
  const user = await syncUserWithPrisma(
    supabaseUser.id,
    supabaseUser.email,
    supabaseUser.phone
  )

  return { ...user, supabaseUser }
}
