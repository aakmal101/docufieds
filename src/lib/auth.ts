import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyOTP } from './otp'
import { generateMemberId } from './utils'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
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
