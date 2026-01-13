import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth API Route Handler
 * 
 * This route handles all NextAuth.js authentication requests:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 * 
 * Environment Variables Required:
 * - NEXTAUTH_SECRET: Must be set in Vercel production environment
 * - NEXTAUTH_URL: Automatically detected in Vercel, but can be set explicitly
 */

// Force dynamic rendering for Vercel serverless
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validate environment before initializing NextAuth
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    '[NextAuth] Production deployment requires NEXTAUTH_SECRET. ' +
    'Please set it in Vercel Dashboard → Settings → Environment Variables'
  )
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }



















