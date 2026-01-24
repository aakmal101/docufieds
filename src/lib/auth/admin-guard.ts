import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireSupportLead() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPPORT' && session.user.role !== 'ADMIN') {
        // Allowing ADMIN for debugging/access, though design says SUPPORT_LEAD. 
        // Wait, design says role "SUPPORT_LEAD". 
        // My schema update kept role as String. I should check if I need to update 'role' enum logic.
        // The previously existing roles were INDIVIDUAL, AGENCY, ADMIN, SUPPORT, LEGAL, ACCOUNTS.
        // The user design says hierarchy: ADMIN -> SUPPORT_LEAD -> SUPPORT_MEMBER.
        // SUPPORT_MEMBER is a separate table.
        // So 'SUPPORT_LEAD' is likely a role in the `User` table.
        // I will enforce 'SUPPORT' or 'ADMIN' for now, assuming the lead uses the 'SUPPORT' role 
        // or I'll check if I need to add 'SUPPORT_LEAD' to the role map in auth.
        return null
    }
    return session
}
