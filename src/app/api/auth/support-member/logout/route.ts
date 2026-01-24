import { destroySupportSession } from '@/lib/auth/support-member'
import { NextResponse } from 'next/server'

export async function POST() {
    await destroySupportSession()
    return NextResponse.json({ success: true })
}
