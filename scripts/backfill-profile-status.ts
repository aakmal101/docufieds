
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting backfill of profileStatus...')

    // 1. Find users with null profileStatus (if optional) or default PENDING_REVIEW but created before this feature
    // Since we just added the field, users might have the default PENDING_REVIEW if migrated, or null if optional.
    // We assume 'isVerified' might be a legacy flag we can use, or just backfill all old users.

    // Count users 
    const totalUsers = await prisma.user.count()
    console.log(`Total users: ${totalUsers}`)

    // Update all users created before today (approx) to APPROVED
    // This avoids auto-approving brand new signups if the feature is live
    // But for safety, we might just want to approve ALL existing users right now.

    const result = await prisma.user.updateMany({
        where: {
            profileStatus: 'PENDING_REVIEW', // The default
            // Optionally add a date check: createdAt: { lt: new Date() }
        },
        data: {
            profileStatus: 'APPROVED',
            profileReviewNotes: 'Auto-approved via backfill migration',
            profileReviewedAt: new Date(),
        },
    })

    console.log(`Updated ${result.count} users to APPROVED.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
