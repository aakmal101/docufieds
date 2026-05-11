/**
 * Demo Auth Seeder — scripts/seed-demo-auth.ts
 *
 * Creates 6 demo users in Supabase Auth (admin API) and syncs each
 * to the Prisma `users` table with the correct role and profile records.
 *
 * Run:  npx tsx --env-file=.env scripts/seed-demo-auth.ts
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// ─── Bootstrap ────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error('❌ Missing required env vars. Ensure .env has NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const pool = new pg.Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Demo User Definitions ───────────────────────────────────────
type Role = 'INDIVIDUAL' | 'ADMIN' | 'LEGAL' | 'SUPPORT' | 'ACCOUNTS' | 'AGENCY' | 'AGENT'

interface DemoUser {
  email: string
  password: string
  role: Role
  full_name: string
  phone: string
  date_of_birth: string
  place_of_birth: string
  agency_name?: string
  agency_license?: string
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'individual@demo.com',
    password: 'demo123456',
    role: 'INDIVIDUAL',
    full_name: 'Demo Individual',
    phone: '+8801700000001',
    date_of_birth: '1995-06-15',
    place_of_birth: 'Dhaka',
  },
  {
    email: 'agency@demo.com',
    password: 'demo123456',
    role: 'AGENCY',
    full_name: 'Demo Agency Owner',
    phone: '+8801700000002',
    date_of_birth: '1988-03-22',
    place_of_birth: 'Chittagong',
    agency_name: 'Demo Travel Agency Ltd.',
    agency_license: 'DTA-2026-DEMO',
  },
  {
    email: 'admin@demo.com',
    password: 'demo123456',
    role: 'ADMIN',
    full_name: 'Demo Administrator',
    phone: '+8801700000003',
    date_of_birth: '1990-01-10',
    place_of_birth: 'Dhaka',
  },
  {
    email: 'agent@demo.com',
    password: 'demo123456',
    role: 'AGENT',
    full_name: 'Demo Agent',
    phone: '+8801700000004',
    date_of_birth: '1992-09-05',
    place_of_birth: 'Sylhet',
  },
  {
    email: 'legal@demo.com',
    password: 'demo123456',
    role: 'LEGAL',
    full_name: 'Demo Legal Officer',
    phone: '+8801700000005',
    date_of_birth: '1991-11-20',
    place_of_birth: 'Rajshahi',
  },
  {
    email: 'accounts@demo.com',
    password: 'demo123456',
    role: 'ACCOUNTS',
    full_name: 'Demo Accounts Officer',
    phone: '+8801700000006',
    date_of_birth: '1993-04-30',
    place_of_birth: 'Khulna',
  },
]

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Docufieds Demo Auth Seeder')
  console.log('─'.repeat(60))

  const results: { email: string; role: string; authId: string; prismaId: string; status: string }[] = []

  for (const demo of DEMO_USERS) {
    try {
      console.log(`\n📧 Processing: ${demo.email} (${demo.role})`)

      // ── Step 1: Create in Supabase Auth ──────────────────────
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: {
          full_name: demo.full_name,
          phone: demo.phone,
          role: demo.role,
          date_of_birth: demo.date_of_birth,
          place_of_birth: demo.place_of_birth,
          ...(demo.agency_name ? { agency_name: demo.agency_name } : {}),
          ...(demo.agency_license ? { agency_license: demo.agency_license } : {}),
        },
      })

      if (authError) {
        // If user already exists, fetch them instead
        if (authError.message?.includes('already been registered') || authError.status === 422) {
          console.log(`   ⚠️  Auth user already exists, fetching...`)
          const { data: listData } = await supabase.auth.admin.listUsers()
          const existingUser = listData?.users?.find(u => u.email === demo.email)
          if (existingUser) {
            // Update metadata to ensure it's current
            await supabase.auth.admin.updateUserById(existingUser.id, {
              user_metadata: {
                full_name: demo.full_name,
                phone: demo.phone,
                role: demo.role,
                date_of_birth: demo.date_of_birth,
                place_of_birth: demo.place_of_birth,
                ...(demo.agency_name ? { agency_name: demo.agency_name } : {}),
                ...(demo.agency_license ? { agency_license: demo.agency_license } : {}),
              },
            })
            const prismaUser = await syncToPrisma(existingUser.id, demo)
            results.push({ email: demo.email, role: demo.role, authId: existingUser.id, prismaId: prismaUser.id, status: '♻️  Updated' })
            console.log(`   ✅ Updated existing → Auth: ${existingUser.id} | Prisma: ${prismaUser.id}`)
            continue
          }
        }
        console.error(`   ❌ Auth error: ${authError.message}`)
        results.push({ email: demo.email, role: demo.role, authId: 'FAILED', prismaId: 'FAILED', status: `❌ ${authError.message}` })
        continue
      }

      const authUser = authData.user
      console.log(`   ✅ Auth user created: ${authUser.id}`)

      // ── Step 2: Sync to Prisma ───────────────────────────────
      const prismaUser = await syncToPrisma(authUser.id, demo)
      console.log(`   ✅ Prisma user synced: ${prismaUser.id} (role=${prismaUser.role})`)

      results.push({ email: demo.email, role: demo.role, authId: authUser.id, prismaId: prismaUser.id, status: '✅ Created' })
    } catch (err: any) {
      console.error(`   ❌ Unexpected error: ${err.message}`)
      results.push({ email: demo.email, role: demo.role, authId: 'ERROR', prismaId: 'ERROR', status: `❌ ${err.message}` })
    }
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('📊 SEED RESULTS SUMMARY')
  console.log('═'.repeat(60))
  console.log('')
  console.log(formatTable(results))
  console.log('')
  console.log('═'.repeat(60))
  console.log('🔑 All demo passwords: demo123456')
  console.log('═'.repeat(60))

  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

// ─── Prisma Sync (role-aware) ─────────────────────────────────────
async function syncToPrisma(supabaseUserId: string, demo: DemoUser) {
  // Check if already exists
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: demo.email },
        { userId: supabaseUserId },
      ],
    },
  })

  if (user) {
    // Update to ensure correct mapping
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        userId: supabaseUserId,
        email: demo.email,
        role: demo.role,
        status: 'ACTIVE',
        isVerified: true,
        dateOfBirth: new Date(demo.date_of_birth),
        placeOfBirth: demo.place_of_birth,
      },
    })
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        userId: supabaseUserId,
        email: demo.email,
        role: demo.role,
        status: 'ACTIVE',
        isVerified: true,
        dateOfBirth: new Date(demo.date_of_birth),
        placeOfBirth: demo.place_of_birth,
      },
    })
  }

  // Create role-specific profiles
  await ensureProfile(user.id, demo)

  return user
}

async function ensureProfile(prismaUserId: string, demo: DemoUser) {
  switch (demo.role) {
    case 'INDIVIDUAL': {
      const existing = await prisma.individualProfile.findUnique({ where: { userId: prismaUserId } })
      if (!existing) {
        const [firstName, ...lastParts] = demo.full_name.split(' ')
        await prisma.individualProfile.create({
          data: {
            userId: prismaUserId,
            firstName,
            lastName: lastParts.join(' ') || null,
            phoneNumber: demo.phone,
          },
        })
      }
      break
    }
    case 'AGENCY': {
      const existing = await prisma.agencyProfile.findUnique({ where: { userId: prismaUserId } })
      if (!existing) {
        await prisma.agencyProfile.create({
          data: {
            userId: prismaUserId,
            businessName: demo.agency_name || null,
            licenseNumber: demo.agency_license || null,
            status: 'ACTIVE',
          },
        })
      }
      break
    }
    case 'AGENT': {
      const existing = await prisma.agentProfile.findUnique({ where: { userId: prismaUserId } })
      if (!existing) {
        await prisma.agentProfile.create({
          data: {
            userId: prismaUserId,
            displayName: demo.full_name,
            phone: demo.phone,
          },
        })
      }
      break
    }
    case 'SUPPORT': {
      const existing = await prisma.supportProfile.findUnique({ where: { userId: prismaUserId } })
      if (!existing) {
        await prisma.supportProfile.create({
          data: {
            userId: prismaUserId,
            department: 'General Support',
          },
        })
      }
      break
    }
    // ADMIN, LEGAL, ACCOUNTS don't have dedicated profile models — base User is sufficient
  }
}

// ─── Table Formatter ──────────────────────────────────────────────
function formatTable(rows: { email: string; role: string; authId: string; prismaId: string; status: string }[]) {
  const header = `${'Email'.padEnd(24)} ${'Role'.padEnd(12)} ${'Auth ID'.padEnd(38)} ${'Prisma ID'.padEnd(28)} Status`
  const sep = '─'.repeat(header.length)
  const lines = rows.map(r =>
    `${r.email.padEnd(24)} ${r.role.padEnd(12)} ${r.authId.substring(0, 36).padEnd(38)} ${r.prismaId.substring(0, 26).padEnd(28)} ${r.status}`
  )
  return [sep, header, sep, ...lines, sep].join('\n')
}

main().catch(err => {
  console.error('💀 Fatal error:', err)
  process.exit(1)
})
