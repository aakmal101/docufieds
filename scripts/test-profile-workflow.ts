
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Starting Profile Review Workflow Test...')

    // 1. Create a Test User
    const email = `test-user-${Date.now()}@example.com`
    console.log(`\n1. Creating test user: ${email}`)
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: 'hashed_password', // Dummy
            fullName: 'Test User',
            role: 'INDIVIDUAL',
            // profileStatus should default to PENDING_REVIEW if schema is correct
        }
    })

    console.log(`   User created. ID: ${user.id}`)
    console.log(`   Initial Profile Status: ${user.profileStatus}`)

    if (user.profileStatus !== 'PENDING_REVIEW') {
        console.warn(`   ⚠️  WARNING: Expected PENDING_REVIEW, got ${user.profileStatus}. Schema default might be missing or overridden.`)
    } else {
        console.log(`   ✅ Status correct.`)
    }

    // 2. Simulate Admin Approval (Mirroring API logic)
    console.log(`\n2. Simulating Admin Approval...`)
    const adminId = user.id // Self-approving for test simplicity (API guards prevent this usually)

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                profileStatus: 'APPROVED',
                profileReviewedAt: new Date(),
                profileReviewedById: adminId,
                isVerified: true
            }
        }),
        prisma.notification.create({
            data: {
                userId: user.id,
                title: 'Profile Approved',
                message: 'Test approval',
                type: 'SUCCESS'
            }
        }),
        prisma.auditLog.create({
            data: {
                actorUserId: adminId,
                action: 'USER_PROFILE_APPROVED',
                targetUserId: user.id,
                metadata: { notes: 'Test approval' }
            }
        })
    ])

    // Verify Approval
    const approvedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { notifications: true, targetAuditLogs: true }
    })

    if (approvedUser?.profileStatus === 'APPROVED' && approvedUser.isVerified) {
        console.log(`   ✅ User status updated to APPROVED.`)
    } else {
        console.error(`   ❌ User status update failed.`)
    }

    if (approvedUser?.notifications.some(n => n.title === 'Profile Approved')) {
        console.log(`   ✅ Notification created.`)
    } else {
        console.error(`   ❌ Notification missing.`)
    }

    if (approvedUser?.targetAuditLogs.some(l => l.action === 'USER_PROFILE_APPROVED')) {
        console.log(`   ✅ Audit Log created.`)
    } else {
        console.error(`   ❌ Audit Log missing.`)
    }

    // 3. Simulate Reset to Pending
    console.log(`\n3. Simulating Reset to Pending...`)
    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                profileStatus: 'PENDING_REVIEW',
                profileReviewedAt: null,
                profileReviewedById: null,
                isVerified: false
            }
        }),
        prisma.auditLog.create({
            data: {
                actorUserId: adminId,
                action: 'USER_PROFILE_RESET_PENDING',
                targetUserId: user.id
            }
        })
    ])

    const resetUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (resetUser?.profileStatus === 'PENDING_REVIEW' && !resetUser.isVerified) {
        console.log(`   ✅ User status reset to PENDING_REVIEW.`)
    } else {
        console.error(`   ❌ User status reset failed.`)
    }

    // Cleanup
    console.log(`\n🧹 Cleaning up...`)
    await prisma.user.delete({ where: { id: user.id } })
    console.log(`   Test user deleted.`)

    console.log(`\n🎉 Test Complete!`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
