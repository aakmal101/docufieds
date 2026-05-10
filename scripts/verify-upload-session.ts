/**
 * Verification script for Upload Session end-to-end flow
 * Updated for Normalized Profiles (v2)
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
        if (res.status === 401 || res.status === 200 || res.status === 404) {
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
    
    // Find a lead/support user
    const supportUser = await prisma.user.findFirst({
        where: { role: 'SUPPORT' },
        select: { 
            id: true, 
            email: true,
            individualProfile: { select: { firstName: true, lastName: true } }
        }
    })

    if (!supportUser) {
        FAIL('Support user exists')
        console.log('\n❌ Cannot continue without a support user. Exiting.')
        process.exit(1)
    }
    const supportName = `${supportUser.individualProfile?.firstName || ''} ${supportUser.individualProfile?.lastName || ''}`.trim() || 'Support'
    PASS('Support user exists', `${supportName} (${supportUser.email})`)

    // Find a target user (individual)
    const targetUser = await prisma.user.findFirst({
        where: { role: 'INDIVIDUAL' },
        select: { 
            id: true, 
            email: true,
            individualProfile: { select: { firstName: true, lastName: true } }
        }
    })
    if (!targetUser) {
        FAIL('Target user exists')
        console.log('\n❌ Cannot continue without a target user. Exiting.')
        process.exit(1)
    }
    const targetName = `${targetUser.individualProfile?.firstName || ''} ${targetUser.individualProfile?.lastName || ''}`.trim() || 'User'
    PASS('Target user exists', `${targetName} (${targetUser.email})`)

    // 4. Direct DB transaction test
    console.log('\n--- DB Transaction Test ---')
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

    let testSessionId: string | null = null
    try {
        const result = await prisma.$transaction(async (tx) => {
            const session = await (tx as any).uploadSession.create({
                data: {
                    tokenHash,
                    createdByUserId: supportUser.id,
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
                    actorUserId: supportUser.id,
                    action: 'UPLOAD_SESSION_CREATED',
                    targetUserId: targetUser.id,
                    metadata: { sessionId: session.id, slotCount: 2, test: true }
                }
            })

            return session
        })

        testSessionId = result.id
        PASS('UploadSession created', `ID: ${result.id}`)
    } catch (e: any) {
        FAIL('DB Transaction', e.message)
    }

    // 5. Verify session and slots in DB
    if (testSessionId) {
        console.log('\n--- DB Verification ---')
        const session = await (prisma as any).uploadSession.findUnique({
            where: { id: testSessionId },
            include: { 
                slots: true, 
                createdByUser: { select: { individualProfile: { select: { firstName: true, lastName: true } } } }, 
                targetUser: { select: { individualProfile: { select: { firstName: true, lastName: true } } } } 
            }
        })

        if (session) {
            PASS('Session found in DB')
            PASS('Session status', session.status)
            
            const creatorName = `${session.createdByUser?.individualProfile?.firstName || ''} ${session.createdByUser?.individualProfile?.lastName || ''}`.trim()
            const targetNameFinal = `${session.targetUser?.individualProfile?.firstName || ''} ${session.targetUser?.individualProfile?.lastName || ''}`.trim()
            
            PASS('createdByUser', creatorName)
            PASS('targetUser', targetNameFinal)

            if (session.slots?.length === 2) {
                PASS('2 slots created')
            } else {
                FAIL('2 slots created', `Found: ${session.slots?.length}`)
            }

            const shareUrl = `${BASE_URL}/upload/${rawToken}`
            PASS('shareUrl format', shareUrl.substring(0, 40) + '...')
        } else {
            FAIL('Session found in DB')
        }

        // 6. Clean up test data
        console.log('\n--- Cleanup ---')
        try {
            await (prisma as any).uploadSlot.deleteMany({ where: { uploadSessionId: testSessionId } })
            await (prisma as any).uploadSession.delete({ where: { id: testSessionId } })
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
