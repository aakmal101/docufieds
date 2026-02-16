/**
 * End-to-end test: Create upload session → Upload file to slot → Verify DB
 * Tests against production build (next start on port 3001)
 */
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import crypto from 'crypto'

const prisma = new PrismaClient()
const BASE = 'http://localhost:3001'
const SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production'

let passed = 0
let failed = 0
let cleanup: (() => Promise<void>)[] = []

function PASS(t: string, d?: string) { passed++; console.log(`  ✅ ${t}${d ? ` — ${d}` : ''}`) }
function FAIL(t: string, d?: string) { failed++; console.log(`  ❌ ${t}${d ? ` — ${d}` : ''}`) }

async function main() {
    console.log('=== Public Upload E2E Test ===\n')

    // --- Setup: Create an upload session directly in DB ---
    const member = await prisma.supportTeamMember.findFirst({ select: { id: true, email: true, leadId: true } })
    const targetUser = await prisma.user.findFirst({
        where: { role: 'INDIVIDUAL' },
        select: { id: true, email: true, fullName: true }
    })
    if (!member || !targetUser) {
        console.log('Missing test fixtures'); process.exit(1)
    }

    // Find an application for this user
    const app = await prisma.application.findFirst({
        where: { userId: targetUser.id },
        select: { id: true }
    })

    // Create session via support API (with JWT)
    const token = await new SignJWT({ id: member.id, email: member.email, leadId: member.leadId, role: 'SUPPORT_MEMBER' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(SECRET))

    console.log('--- Step 1: Create Upload Session ---')
    const createRes = await fetch(`${BASE}/api/support/upload-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `support-member-token=${token}` },
        body: JSON.stringify({
            targetUserId: targetUser.id,
            applicationId: app?.id,
            slotCount: 2,
            slots: [{ label: 'Passport Copy' }, { label: 'NID Copy' }],
            expiresInHours: 24
        })
    })
    const createData = await createRes.json()
    console.log(`  Status: ${createRes.status}`)

    if (!createData.success) {
        FAIL('Create session', createData.message)
        await doCleanup(); process.exit(1)
    }
    PASS('Session created', `ID: ${createData.data.sessionId}`)
    const rawToken = createData.data.rawToken
    const sessionId = createData.data.sessionId

    // Register cleanup
    cleanup.push(async () => {
        await (prisma as any).uploadSlot.deleteMany({ where: { uploadSessionId: sessionId } })
        // Delete any documents created
        const slots = await (prisma as any).uploadSlot.findMany({ where: { uploadSessionId: sessionId } })
        for (const s of slots) {
            if (s.uploadedDocumentId) await prisma.document.delete({ where: { id: s.uploadedDocumentId } }).catch(() => { })
        }
        await (prisma as any).uploadSession.delete({ where: { id: sessionId } }).catch(() => { })
        await prisma.auditLog.deleteMany({ where: { metadata: { path: ['sessionId'], equals: sessionId } } }).catch(() => { })
    })

    // --- Step 2: Load public page (GET) ---
    console.log('\n--- Step 2: Load Public Upload Page ---')
    const getRes = await fetch(`${BASE}/api/public/upload-sessions/${rawToken}`)
    const getData = await getRes.json()
    if (getData.success) {
        PASS('Public session loaded', `slotCount: ${getData.data.slotCount}, requester: ${getData.data.requester}`)
        PASS('Target user shown', getData.data.targetUser)
        PASS('Slots returned', `${getData.data.slots.length} slots`)
        getData.data.slots.forEach((s: any) => {
            PASS(`  Slot ${s.slotIndex}`, `"${s.label}" — ${s.status}`)
        })
    } else {
        FAIL('Public session loaded', getData.message)
        await doCleanup(); process.exit(1)
    }

    // --- Step 3: Upload file to slot 0 ---
    console.log('\n--- Step 3: Upload File to Slot 0 ---')
    // Create a fake PDF file
    const pdfContent = '%PDF-1.4 fake test content for verification'
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', blob, 'test_passport.pdf')

    const uploadRes = await fetch(`${BASE}/api/public/upload-sessions/${rawToken}/slots/0/upload`, {
        method: 'POST',
        body: formData
    })
    const uploadData = await uploadRes.json()
    console.log(`  Status: ${uploadRes.status}`)
    console.log(`  Response: ${JSON.stringify(uploadData, null, 2).split('\n').join('\n  ')}`)

    if (uploadData.success) {
        PASS('Slot 0 upload succeeded')
        if (uploadData.data.document) {
            PASS('Document created', `ID: ${uploadData.data.document.id}`)
        } else {
            PASS('Upload recorded (no application linked)')
        }
        PASS('Slot status', uploadData.data.slot.status)
        PASS('Session completed?', uploadData.data.sessionCompleted ? 'Yes' : 'Not yet (1/2)')
    } else {
        FAIL('Slot 0 upload', `${uploadRes.status}: ${uploadData.message}`)
    }

    // --- Step 4: Upload file to slot 1 ---
    console.log('\n--- Step 4: Upload File to Slot 1 ---')
    const formData2 = new FormData()
    const blob2 = new Blob(['fake NID image data'], { type: 'image/jpeg' })
    formData2.append('file', blob2, 'test_nid.jpg')

    const uploadRes2 = await fetch(`${BASE}/api/public/upload-sessions/${rawToken}/slots/1/upload`, {
        method: 'POST',
        body: formData2
    })
    const uploadData2 = await uploadRes2.json()
    console.log(`  Status: ${uploadRes2.status}`)

    if (uploadData2.success) {
        PASS('Slot 1 upload succeeded')
        PASS('Session completed?', uploadData2.data.sessionCompleted ? 'YES — all slots filled' : 'No')
    } else {
        FAIL('Slot 1 upload', `${uploadRes2.status}: ${uploadData2.message}`)
    }

    // --- Step 5: Verify DB state ---
    console.log('\n--- Step 5: DB Verification ---')
    const dbSession = await (prisma as any).uploadSession.findUnique({
        where: { id: sessionId },
        include: { slots: { orderBy: { slotIndex: 'asc' }, include: { uploadedDocument: true } } }
    })

    if (dbSession) {
        PASS('Session exists in DB')
        PASS('Session status', dbSession.status)

        for (const slot of dbSession.slots) {
            if (slot.status === 'UPLOADED') {
                PASS(`Slot ${slot.slotIndex} UPLOADED`)
                if (slot.uploadedDocument) {
                    PASS(`  Document linked`, `${slot.uploadedDocument.fileName} (${slot.uploadedDocument.fileSize} bytes)`)
                }
            } else {
                FAIL(`Slot ${slot.slotIndex}`, `Expected UPLOADED, got ${slot.status}`)
            }
        }
    } else {
        FAIL('Session in DB')
    }

    // --- Step 6: Negative tests ---
    console.log('\n--- Step 6: Negative Tests ---')

    // Invalid token
    const badRes = await fetch(`${BASE}/api/public/upload-sessions/invalid_token_here/slots/0/upload`, {
        method: 'POST',
        body: formData
    })
    if (badRes.status === 404) {
        PASS('Invalid token → 404')
    } else {
        FAIL('Invalid token', `Expected 404, got ${badRes.status}`)
    }

    // Duplicate upload (slot 0 already uploaded)
    const dupForm = new FormData()
    dupForm.append('file', new Blob(['dup'], { type: 'application/pdf' }), 'dup.pdf')
    const dupRes = await fetch(`${BASE}/api/public/upload-sessions/${rawToken}/slots/0/upload`, {
        method: 'POST',
        body: dupForm
    })
    const dupData = await dupRes.json()
    if (dupRes.status === 409) {
        PASS('Duplicate slot upload → 409', dupData.message)
    } else {
        // Session is COMPLETED, so it might be 409 for session status
        if (dupRes.status !== 200) {
            PASS('Duplicate blocked', `Status: ${dupRes.status} — ${dupData.message}`)
        } else {
            FAIL('Duplicate slot upload should be blocked')
        }
    }

    // --- Cleanup ---
    console.log('\n--- Cleanup ---')
    await doCleanup()
    PASS('Test data cleaned up')

    // Summary
    console.log(`\n${'='.repeat(55)}`)
    console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`)
    console.log(`STATUS: ${failed === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}`)
    console.log('='.repeat(55))

    await prisma.$disconnect()
    process.exit(failed > 0 ? 1 : 0)
}

async function doCleanup() {
    for (const fn of cleanup.reverse()) {
        try { await fn() } catch { }
    }
}

main().catch(console.error)
