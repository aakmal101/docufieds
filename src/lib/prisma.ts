import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client Configuration for Supabase
 * 
 * IMPORTANT: For Supabase on Vercel/serverless, use connection pooler:
 * 
 * DATABASE_URL (Runtime - Transaction Pooler):
 *   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
 * 
 * DIRECT_URL (Migrations - Direct Connection):
 *   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
 * 
 * Get these from: Supabase Dashboard → Settings → Database → Connection string
 */

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please set it in your .env.local file or Vercel environment variables.'
  )
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Test connection on startup (development only)
if (process.env.NODE_ENV === 'development') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Prisma connected to database successfully')
    })
    .catch((error) => {
      console.error('❌ Prisma connection failed:', error.message)
      console.error('\n💡 Troubleshooting:')
      console.error('1. Check DATABASE_URL is correct')
      console.error('2. For Supabase, use connection pooler URL (port 6543) with ?pgbouncer=true')
      console.error('3. Verify database is not paused (Supabase free tier pauses after inactivity)')
      console.error('4. Check network/firewall settings')
    })
}
