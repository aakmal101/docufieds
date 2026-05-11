import { createClient } from './server'
import { prisma } from '../prisma'

/**
 * Metadata shape written by the signup form into Supabase user_metadata.
 */
interface SignupMetadata {
  full_name?: string
  phone?: string
  date_of_birth?: string
  place_of_birth?: string
  role?: string
  agency_name?: string
  agency_license?: string
}

/**
 * Parse a "full_name" string into first / last name.
 * Returns { firstName, lastName } with lastName being everything after the first space.
 */
function splitFullName(fullName?: string): { firstName: string | null; lastName: string | null } {
  if (!fullName) return { firstName: null, lastName: null }
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  }
}

/**
 * Sync Supabase Auth user with Prisma User.
 *
 * This is the PRIMARY sync path — called immediately after supabase.auth.signUp()
 * succeeds via the /api/auth/register server route.
 *
 * It maps every field from Supabase user_metadata to the correct Prisma columns:
 *   - full_name  → IndividualProfile.firstName / lastName
 *   - phone      → IndividualProfile.phoneNumber
 *   - date_of_birth → User.dateOfBirth
 *   - place_of_birth → User.placeOfBirth
 *   - role       → User.role
 *   - agency_name / agency_license → AgencyProfile (if AGENCY role)
 */
export async function syncUserWithPrisma(
  supabaseUserId: string,
  email?: string,
  metadata?: SignupMetadata,
) {
  try {
    const { firstName, lastName } = splitFullName(metadata?.full_name)
    const role = (['INDIVIDUAL', 'AGENCY', 'AGENT'].includes(metadata?.role || '')
      ? metadata!.role!
      : 'INDIVIDUAL') as 'INDIVIDUAL' | 'AGENCY' | 'AGENT'

    // Primary lookup by Supabase UUID (stored as User.id)
    let user = await prisma.user.findUnique({
      where: { id: supabaseUserId },
      include: { individualProfile: true, agencyProfile: true },
    })

    if (!user) {
      // Also check by email to handle edge cases (e.g. social auth)
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
          include: { individualProfile: true, agencyProfile: true },
        })
      }
    }

    if (!user) {
      // ── CREATE ─────────────────────────────────────────────
      user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: email || null,
          role,
          status: 'ACTIVE',
          isVerified: true,
          dateOfBirth: metadata?.date_of_birth
            ? new Date(metadata.date_of_birth)
            : null,
          placeOfBirth: metadata?.place_of_birth || null,
          // Individual / Agent profiles always get phone + name
          ...(['INDIVIDUAL', 'AGENT'].includes(role)
            ? {
                individualProfile: {
                  create: {
                    firstName,
                    lastName,
                    phoneNumber: metadata?.phone || null,
                  },
                },
              }
            : {}),
          // Agency profile
          ...(role === 'AGENCY'
            ? {
                agencyProfile: {
                  create: {
                    businessName: metadata?.agency_name || null,
                    licenseNumber: metadata?.agency_license || null,
                  },
                },
                individualProfile: {
                  create: {
                    firstName,
                    lastName,
                    phoneNumber: metadata?.phone || null,
                  },
                },
              }
            : {}),
        },
        include: { individualProfile: true, agencyProfile: true },
      })

      console.log('[syncUserWithPrisma] Created Prisma user:', user.id, user.role)
    } else {
      // ── UPDATE existing record with latest metadata ────────
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          dateOfBirth: metadata?.date_of_birth
            ? new Date(metadata.date_of_birth)
            : user.dateOfBirth,
          placeOfBirth: metadata?.place_of_birth || user.placeOfBirth,
        },
        include: { individualProfile: true, agencyProfile: true },
      })

      // Upsert individual profile with name/phone
      if (firstName || metadata?.phone) {
        await prisma.individualProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            firstName,
            lastName,
            phoneNumber: metadata?.phone || null,
          },
          update: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
            ...(metadata?.phone ? { phoneNumber: metadata.phone } : {}),
          },
        })
      }
    }

    return user
  } catch (error) {
    console.error('[syncUserWithPrisma] Error:', error)
    throw error
  }
}

/**
 * Get or create user from Supabase Auth session.
 * Used by server components / route handlers that have cookie access.
 */
export async function getUserFromSession() {
  const supabase = await createClient()
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

  if (error || !supabaseUser) {
    return null
  }

  // Sync with Prisma, passing full metadata
  const meta = supabaseUser.user_metadata as SignupMetadata | undefined
  const user = await syncUserWithPrisma(
    supabaseUser.id,
    supabaseUser.email,
    meta,
  )

  return { ...user, supabaseUser }
}
