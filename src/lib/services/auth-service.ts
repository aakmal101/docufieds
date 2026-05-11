import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AppUser } from '@/types/user'

/**
 * Centralized Identity Service
 * Handles user identity and profile retrieval combining Supabase Auth and Prisma.
 *
 * Primary sync happens at signup via POST /api/auth/register.
 * This service acts as the JIT FALLBACK — if the Prisma record is missing
 * (e.g. primary sync failed, social login, admin-created user), it provisions
 * a full record using Supabase user_metadata so it's never "hollow".
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      return null
    }

    // Query Prisma for the user and their associated normalized profiles
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: {
        individualProfile: true,
        agencyProfile: true,
        supportProfile: true,
      },
    })

    if (!user) {
      console.log('[Identity Service] User desync detected. Provisioning Prisma record for:', supabaseUser.email)

      // ── Extract metadata so the JIT record is NOT hollow ──
      const meta = (supabaseUser.user_metadata || {}) as Record<string, any>
      const fullName = (meta.full_name || '') as string
      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || null
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
      const phone = (meta.phone || null) as string | null
      const dateOfBirth = meta.date_of_birth ? new Date(meta.date_of_birth) : null
      const placeOfBirth = (meta.place_of_birth || null) as string | null
      const rawRole = (meta.role || 'INDIVIDUAL') as string
      const role = (['INDIVIDUAL', 'AGENCY', 'AGENT', 'ADMIN', 'LEGAL', 'SUPPORT', 'ACCOUNTS', 'CASH_OFFICER'].includes(rawRole)
        ? rawRole
        : 'INDIVIDUAL') as any

      const newUser = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          role,
          status: 'ACTIVE',
          dateOfBirth,
          placeOfBirth,
          // Always create an IndividualProfile with name/phone
          individualProfile: {
            create: {
              firstName,
              lastName,
              phoneNumber: phone,
            },
          },
          // Create AgencyProfile if role is AGENCY
          ...(role === 'AGENCY'
            ? {
                agencyProfile: {
                  create: {
                    businessName: (meta.agency_name || null) as string | null,
                    licenseNumber: (meta.agency_license || null) as string | null,
                  },
                },
              }
            : {}),
        },
        include: {
          individualProfile: true,
          agencyProfile: true,
          supportProfile: true,
        },
      })

      console.log('[Identity Service] JIT provisioned user:', newUser.id, newUser.role)
      return newUser as AppUser
    }

    return user as AppUser
  } catch (error) {
    console.error('[AuthService] Error fetching current user:', error)
    return null
  }
}

