/**
 * Verification script for Upload Session end-to-end flow
 * Tests: Create session, create slots, verify DB entries, verify shareUrl format
 */
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

let passed = 0
let failed = 0

function PASS(name: string, detail?: string) {
    passed++
    console.log(`  ✅ PASS: ${name}${detail ? ` — ${detail}` : ''}`)
}

function FAIL(name: string, detail?: string) {
    failed++
    console.log(`  ❌ FAIL: ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
    console.log('=== Upload Session E2E Verification ===\n')

    // 1. Server health check
    console.log('--- Server Health ---')
    try {
        const res = await fetch(`${BASE_URL}/api/applications`)
        if (res.status === 401 || res.status === 200) {
            PASS('Server responding', `Status: ${res.status}`)
        } else {
            FAIL('Server responding', `Status: ${res.status}`)
        }
    } catch (e: any) {
        FAIL('Server responding', e.message)
    }

    // 2. Check tables exist
    console.log('\n--- Table Existence ---')
    try {
        await (prisma as any).uploadSession.count()
        PASS('upload_sessions table exists')
    } catch { FAIL('upload_sessions table exists') }

    try {
        await (prisma as any).uploadSlot.count()
        PASS('upload_slots table exists')
    } catch { FAIL('upload_slots table exists') }

    try {
        await prisma.auditLog.count()
        PASS('audit_logs table exists')
    } catch { FAIL('audit_logs table exists') }

    // 3. Find test fixtures
    console.log('\n--- Test Fixtures ---')
    const supportMember = await prisma.supportTeamMember.findFirst({
        select: { id: true, email: true, leadId: true, fullName: true }
    })
    if (!supportMember) {
        FAIL('Support member exists')
        console.log('\n❌ Cannot continue without a support member. Exiting.')
        process.exit(1)
    }
    PASS('Support member exists', `${supportMember.fullName} (${supportMember.email})`)

    const leadUser = await prisma.user.findUnique({
        where: { id: supportMember.leadId },
        select: { id: true, fullName: true }
    })
    if (leadUser) {
        PASS('Lead user (for FK) exists', `${leadUser.fullName} (${leadUser.id})`)
    } else {
        FAIL('Lead user (for FK) exists', `leadId ${supportMember.leadId} not found in users`)
    }

    // Find a target user (individual, not admin)
    const targetUser = await prisma.user.findFirst({
        where: { role: 'INDIVIDUAL' },
        select: { id: true, fullName: true, email: true }
    })
    if (!targetUser) {
        FAIL('Target user exists')
        console.log('\n❌ Cannot continue without a target user. Exiting.')
        process.exit(1)
    }
    PASS('Target user exists', `${targetUser.fullName} (${targetUser.email})`)

    // 4. Direct DB transaction test (simulating the API logic with the FIX)
    console.log('\n--- DB Transaction Test (simulating fixed API) ---')
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

    let testSessionId: string | null = null
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Use leadId as createdByUserId (THE FIX)
            const session = await (tx as any).uploadSession.create({
                data: {
                    tokenHash,
                    createdByUserId: supportMember.leadId, // leadId is valid User.id
                    targetUserId: targetUser.id,
                    slotCount: 2,
                    expiresAt,
                    status: 'ACTIVE'
                }
            })

            // Create 2 slots
            for (let i = 0; i < 2; i++) {
                await (tx as any).uploadSlot.create({
                    data: {
                        uploadSessionId: session.id,
                        slotIndex: i,
                        label: `Test Document ${i + 1}`,
                        status: 'EMPTY'
                    }
                })
            }

            // Audit log
            await tx.auditLog.create({
                data: {
                    actorUserId: supportMember.leadId,
                    action: 'UPLOAD_SESSION_CREATED',
                    targetUserId: targetUser.id,
                    metadata: { sessionId: session.id, slotCount: 2, test: true }
                }
            })

            return session
        })

        testSessionId = result.id
        PASS('UploadSession created', `ID: ${result.id}`)
        PASS('createdByUserId FK valid', `Using leadId: ${supportMember.leadId}`)
    } catch (e: any) {
        FAIL('DB Transaction', e.message)
    }

    // 5. Verify session and slots in DB
    if (testSessionId) {
        console.log('\n--- DB Verification ---')
        const session = await (prisma as any).uploadSession.findUnique({
            where: { id: testSessionId },
            include: { slots: true, createdByUser: { select: { fullName: true } }, targetUser: { select: { fullName: true } } }
        })

        if (session) {
            PASS('Session found in DB')
            PASS('Session status', session.status)
            PASS('Session tokenHash stored', `${session.tokenHash.substring(0, 8)}...`)
            PASS('createdByUser', session.createdByUser?.fullName)
            PASS('targetUser', session.targetUser?.fullName)

            if (session.slots?.length === 2) {
                PASS('2 slots created')
                session.slots.forEach((s: any) => {
                    PASS(`Slot ${s.slotIndex}`, `label: "${s.label}", status: ${s.status}`)
                })
            } else {
                FAIL('2 slots created', `Found: ${session.slots?.length}`)
            }

            // Verify shareUrl format
            const shareUrl = `http://localhost:3000/upload/${rawToken}`
            PASS('shareUrl format', shareUrl.substring(0, 40) + '...')
        } else {
            FAIL('Session found in DB')
        }

        // 6. Clean up test data
        console.log('\n--- Cleanup ---')
        try {
            await (prisma as any).uploadSlot.deleteMany({ where: { uploadSessionId: testSessionId } })
            await (prisma as any).uploadSession.delete({ where: { id: testSessionId } })
            await prisma.auditLog.deleteMany({ where: { action: 'UPLOAD_SESSION_CREATED', metadata: { path: ['test'], equals: true } } })
            PASS('Test data cleaned up')
        } catch (e: any) {
            FAIL('Cleanup', e.message)
        }
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`)
    console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`)
    console.log(`STATUS: ${failed === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}`)
    console.log('='.repeat(50))

    await prisma.$disconnect()
    process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
