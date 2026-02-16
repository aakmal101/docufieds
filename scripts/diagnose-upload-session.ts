import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnose() {
    console.log('=== Upload Session Diagnostic ===\n')

    // 1. Check if tables exist
    try {
        const sessionCount = await (prisma as any).uploadSession.count()
        console.log(`✅ upload_sessions table exists, rows: ${sessionCount}`)
    } catch (e: any) {
        console.log(`❌ upload_sessions table error: ${e.message}`)
    }

    try {
        const slotCount = await (prisma as any).uploadSlot.count()
        console.log(`✅ upload_slots table exists, rows: ${slotCount}`)
    } catch (e: any) {
        console.log(`❌ upload_slots table error: ${e.message}`)
    }

    try {
        const auditCount = await prisma.auditLog.count()
        console.log(`✅ audit_logs table exists, rows: ${auditCount}`)
    } catch (e: any) {
        console.log(`❌ audit_logs table error: ${e.message}`)
    }

    // 2. Check support members exist
    try {
        const members = await prisma.supportTeamMember.findMany({
            select: { id: true, email: true, fullName: true, leadId: true }
        })
        console.log(`\n✅ Support team members: ${members.length}`)
        members.forEach(m => console.log(`   - ${m.fullName} (${m.email}) | id: ${m.id} | leadId: ${m.leadId}`))

        // 3. Check if leadId maps to a valid User
        for (const m of members) {
            const leadUser = await prisma.user.findUnique({ where: { id: m.leadId }, select: { id: true, fullName: true } })
            if (leadUser) {
                console.log(`   ✅ Lead user for ${m.email}: ${leadUser.fullName} (${leadUser.id})`)
            } else {
                console.log(`   ❌ Lead user NOT FOUND for ${m.email} (leadId: ${m.leadId})`)
            }
        }
    } catch (e: any) {
        console.log(`❌ Support member query error: ${e.message}`)
    }

    // 4. Check if we can do a test insert (with rollback)
    console.log('\n=== Test Insert (will rollback) ===')

    // Find a valid user for targetUserId and createdByUserId 
    const testUser = await prisma.user.findFirst({ select: { id: true, email: true } })
    if (!testUser) {
        console.log('❌ No users found in DB')
        return
    }
    console.log(`Using test user: ${testUser.email} (${testUser.id})`)

    try {
        const crypto = require('crypto')
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        const result = await prisma.$transaction(async (tx) => {
            const session = await (tx as any).uploadSession.create({
                data: {
                    tokenHash,
                    createdByUserId: testUser.id,
                    targetUserId: testUser.id,
                    slotCount: 1,
                    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
                    status: 'ACTIVE'
                }
            })
            console.log(`✅ UploadSession created: ${session.id}`)

            const slot = await (tx as any).uploadSlot.create({
                data: {
                    uploadSessionId: session.id,
                    slotIndex: 0,
                    label: 'Test Document 1',
                    status: 'EMPTY'
                }
            })
            console.log(`✅ UploadSlot created: ${slot.id}`)

            const audit = await tx.auditLog.create({
                data: {
                    actorUserId: testUser.id,
                    action: 'TEST_DIAGNOSTIC',
                    targetUserId: testUser.id,
                    metadata: { test: true }
                }
            })
            console.log(`✅ AuditLog created: ${audit.id}`)

            // Clean up - delete test data
            await (tx as any).uploadSlot.delete({ where: { id: slot.id } })
            await (tx as any).uploadSession.delete({ where: { id: session.id } })
            await tx.auditLog.delete({ where: { id: audit.id } })
            console.log('✅ Test data cleaned up')

            return { session, slot, audit }
        })
        console.log('\n✅✅✅ Full transaction SUCCEEDED - tables and FK constraints are valid')
    } catch (e: any) {
        console.log(`\n❌❌❌ Transaction FAILED: ${e.message}`)
        if (e.code) console.log(`   Error code: ${e.code}`)
        if (e.meta) console.log(`   Meta: ${JSON.stringify(e.meta)}`)
    }

    // 5. Check SupportTeamMember.id vs User.id issue
    console.log('\n=== FK Compatibility Check ===')
    const member = await prisma.supportTeamMember.findFirst({ select: { id: true, email: true } })
    if (member) {
        console.log(`SupportTeamMember.id: ${member.id}`)
        const asUser = await prisma.user.findUnique({ where: { id: member.id } })
        console.log(`Is this also a valid User.id? ${asUser ? '✅ YES' : '❌ NO - THIS IS THE BUG'}`)
        if (!asUser) {
            console.log(`   ⚠️  When support member auth is used, actorUserId = member.id = "${member.id}"`)
            console.log(`   ⚠️  But createdByUserId FK requires a valid users.id`)
            console.log(`   ⚠️  This causes: Foreign key constraint violation`)
        }
    }

    await prisma.$disconnect()
}

diagnose().catch(console.error)
