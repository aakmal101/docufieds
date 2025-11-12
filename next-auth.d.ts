import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role?: string
      status?: string
      memberId?: string | null
      userId?: string | null
      phone?: string | null
      fullName?: string | null
    }
  }

  interface User extends DefaultUser {
    role?: string
    status?: string
    memberId?: string | null
    userId?: string | null
    phone?: string | null
    fullName?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    status?: string
    memberId?: string | null
    userId?: string | null
    phone?: string | null
    fullName?: string | null
  }
}


