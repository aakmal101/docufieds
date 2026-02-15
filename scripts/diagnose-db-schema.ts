
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Diagnosing Database Schema...')

    try {
        // 1. Basic Connection
        console.log('1. Testing User Connection...')
        const userCount = await prisma.user.count()
        console.log(`   ✅ User count: ${userCount}`)

        // 2. Test New Field (profileStatus)
        console.log('\n2. Testing "profileStatus" field existence...')
        try {
            const user = await prisma.user.findFirst({
                select: { id: true, profileStatus: true }
            })
            console.log(`   ✅ profileStatus exists. Sample value: ${user?.profileStatus}`)
        } catch (e: any) {
            console.error(`   ❌ Failed to select profileStatus. Error: ${e.message}`)
            console.log('   👉 CONCLUSION: Pending migration for "profileStatus" has NOT been applied.')
        }

        // 3. Test New Table (AuditLog)
        console.log('\n3. Testing "AuditLog" table existence...')
        try {
            const logs = await prisma.auditLog.count()
            console.log(`   ✅ AuditLog table exists. Count: ${logs}`)
        } catch (e: any) {
            console.error(`   ❌ Failed to access AuditLog. Error: ${e.message}`)
            console.log('   👉 CONCLUSION: Pending migration for "AuditLog" has NOT been applied.')
        }

    } catch (e: any) {
        console.error('SERVER ERROR:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
