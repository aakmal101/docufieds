import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            role: string
            status: string
            memberId?: string
            userId?: string
            fullName?: string
            phone?: string
            // Add other properties that are returned in the session
        } & DefaultSession['user']
    }

    interface User {
        id: string
        role: string
        status: string
        memberId?: string
        userId?: string
        fullName?: string
        phone?: string
        passwordHash?: string | null
        isVerified?: boolean
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: string
        status?: string
        memberId?: string
        userId?: string
        fullName?: string
        phone?: string
        sub?: string
    }
}
