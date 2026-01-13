import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyOTP } from './otp'
import { generateMemberId } from './utils'
import bcrypt from 'bcryptjs'

/**
 * NextAuth Configuration
 * 
 * REQUIRED ENVIRONMENT VARIABLES (must be set in Vercel):
 * - NEXTAUTH_SECRET: A random secret string used to encrypt JWT tokens and session cookies.
 *   Generate one using: openssl rand -base64 32
 *   Or use: https://generate-secret.vercel.app/32
 * 
 * - NEXTAUTH_URL: The canonical URL of your site (e.g., https://yourdomain.com)
 *   For local development: http://localhost:3000
 *   For production: Your production domain
 * 
 * IMPORTANT: Never commit these values to the repository.
 * Set them in Vercel Dashboard → Settings → Environment Variables
 */

// Validate required environment variables
const getNextAuthSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[NextAuth] Missing NEXTAUTH_SECRET. ' +
        'Please set NEXTAUTH_SECRET in your Vercel environment variables. ' +
        'Generate one at: https://generate-secret.vercel.app/32'
      )
    } else {
      // Development mode: use a fallback but warn
      console.warn(
        '[NextAuth] WARNING: NEXTAUTH_SECRET is not set. ' +
        'Using a development fallback. This will NOT work in production. ' +
        'Set NEXTAUTH_SECRET in your .env.local file.'
      )
      return 'development-secret-change-in-production'
    }
  }
  
  return secret
}

const getNextAuthUrl = (): string => {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  // NEXTAUTH_URL is automatically used by NextAuth, but we can also set it explicitly
  // NextAuth will use process.env.NEXTAUTH_URL automatically
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Phone/Email/UserID', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.otp) {
          return null
        }

        try {
          // Find user by phone, email, or userId
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: credentials.identifier },
                { email: credentials.identifier },
                { userId: credentials.identifier },
              ],
            },
          })

          // If user doesn't exist, create a demo user based on the identifier
          if (!user) {
            const role = credentials.identifier.includes('@demo.com') 
              ? credentials.identifier.split('@')[0].toUpperCase()
              : 'INDIVIDUAL'

            // Generate member ID for approved users
            const memberId = role === 'INDIVIDUAL' ? generateMemberId() : undefined

            user = await prisma.user.create({
              data: {
                email: credentials.identifier,
                phone: `+123456789${Date.now().toString().slice(-3)}`, // Unique demo phone using timestamp
                fullName: `${role} User`,
                role: role as any,
                status: role === 'INDIVIDUAL' ? 'PENDING' : 'APPROVED',
                memberId,
                isVerified: true,
                // Add role-specific data
                ...(role === 'AGENCY' && {
                  agencyName: 'Demo Travel Agency',
                  agencyLicense: 'DEMO123456',
                  creditLimit: 10000,
                  outstandingAmount: 0,
                  documentLimit: 50,
                }),
                ...(role === 'ADMIN' && {
                  fullName: 'System Administrator',
                }),
                ...(role === 'SUPPORT' && {
                  fullName: 'Support Representative',
                }),
                ...(role === 'LEGAL' && {
                  fullName: 'Legal Officer',
                }),
                ...(role === 'ACCOUNTS' && {
                  fullName: 'Accounts Manager',
                }),
              },
            })
          }

          // Verify OTP (disabled for development)
          // const isValidOTP = await verifyOTP(
          //   credentials.identifier,
          //   credentials.otp
          // )

          // if (!isValidOTP) {
          //   return null
          // }

          return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            userId: user.userId,
            role: user.role,
            status: user.status,
            memberId: user.memberId,
            fullName: user.fullName,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.status = user.status
        token.memberId = user.memberId
        token.userId = user.userId
        token.phone = user.phone
        token.fullName = user.fullName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.memberId = token.memberId as string
        session.user.userId = token.userId as string
        session.user.phone = token.phone as string
        session.user.fullName = token.fullName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
