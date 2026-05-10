import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AppUser } from '@/types/user'

/**
 * Centralized Identity Service
 * Handles user identity and profile retrieval combining Supabase Auth and Prisma.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      return null
    }

    // Query Prisma for the user and their associated normalized profiles
    // The id in Prisma matches the Supabase auth.users UUID
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: {
        individualProfile: true,
        agencyProfile: true,
        supportProfile: true,
      },
    })

    if (!user) {
      return null
    }

    return user as AppUser
  } catch (error) {
    console.error('[AuthService] Error fetching current user:', error)
    return null
  }
}
