/**
 * Simplified live API test using support-member-token JWT
 */
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()

async function main() {
    console.log('=== Simplified Live API Test ===\n')

    // Get support member
    const member = await prisma.supportTeamMember.findFirst({
        select: { id: true, email: true, leadId: true }
    })
    if (!member) { console.log('No support member'); process.exit(1) }
    console.log(`Member: ${member.email} | id: ${member.id} | leadId: ${member.leadId}`)

    // Get target user
    const targetUser = await prisma.user.findFirst({
        where: { role: 'INDIVIDUAL' },
        select: { id: true, email: true }
    })
    if (!targetUser) { console.log('No target user'); process.exit(1) }
    console.log(`Target: ${targetUser.email} | id: ${targetUser.id}`)

    // Generate JWT
    const secret = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'
    const token = await new SignJWT({
        id: member.id,
        email: member.email,
        leadId: member.leadId,
        role: 'SUPPORT_MEMBER'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(secret))

    console.log(`Token generated: ${token.substring(0, 30)}...`)

    // Make API call
    console.log('\nCalling POST http://localhost:3001/api/support/upload-sessions ...')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
        const res = await fetch('http://localhost:3001/api/support/upload-sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `support-member-token=${token}`
            },
            body: JSON.stringify({
                targetUserId: targetUser.id,
                slotCount: 2,
                slots: [{ label: 'Passport' }, { label: 'NID' }],
                expiresInHours: 24
            }),
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        console.log(`Status: ${res.status}`)
        const data = await res.json()
        console.log(`Response: ${JSON.stringify(data, null, 2)}`)

        if (data.success) {
            console.log(`\n✅ SUCCESS! Link: ${data.data.shareUrl}`)

            // Verify in DB
            const session = await (prisma as any).uploadSession.findUnique({
                where: { id: data.data.sessionId },
                include: { slots: true }
            })
            console.log(`\nDB verification:`)
            console.log(`  Session: ${session?.id ? '✅ exists' : '❌ missing'}`)
            console.log(`  Slots: ${session?.slots?.length === 2 ? '✅ 2 created' : '❌ wrong count'}`)
            console.log(`  Status: ${session?.status}`)
            console.log(`  createdByUserId: ${session?.createdByUserId}`)

            // Cleanup
            await (prisma as any).uploadSlot.deleteMany({ where: { uploadSessionId: data.data.sessionId } })
            await (prisma as any).uploadSession.delete({ where: { id: data.data.sessionId } })
            console.log('\n✅ Test data cleaned up')
        } else {
            console.log(`\n❌ FAILED: ${data.message}`)
        }
    } catch (e: any) {
        clearTimeout(timeoutId)
        console.log(`\n❌ Fetch error: ${e.message}`)
    }

    await prisma.$disconnect()
}

main().catch(console.error)
