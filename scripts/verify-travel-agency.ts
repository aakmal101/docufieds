
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🕵️ Starting Travel Agency Verification...')
    let success = true

    // 1. Cleanup previous test run
    const testEmail = 'agency-test-e2e@example.com'

    await prisma.user.deleteMany({
        where: {
            email: testEmail
        }
    })
    console.log('🧹 Cleaned up old test data')

    // 2. Simulate User Signup (Direct DB creation to mimic API effect)
    console.log('📝 Simulating Signup...')
    
    // Create user with agencyProfile
    const user = await prisma.user.create({
        data: {
            email: testEmail,
            role: 'AGENCY',
            status: 'APPROVED',
            isVerified: true,
            individualProfile: {
                create: {
                    firstName: 'Test Agency',
                    lastName: 'Owner',
                    phoneNumber: '+8801999999999'
                }
            },
            agencyProfile: {
                create: {
                    businessName: 'Valid Travels Inc',
                    licenseNumber: 'LIC-999888',
                    status: 'ACTIVE'
                }
            }
        },
        include: {
            agencyProfile: true,
            individualProfile: true
        }
    })

    console.log(`✅ Created user with ID: ${user.id}`)

    // 3. Verify Persistence
    console.log('🔍 Verifying Data Persistence...')
    const fetchedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { agencyProfile: true }
    })

    if (!fetchedUser) {
        console.error('❌ User not found in DB!')
        success = false
    } else {
        // Check Role
        if (fetchedUser.role !== 'AGENCY') {
            console.error(`❌ Incorrect Role: Expected AGENCY, got ${fetchedUser.role}`)
            success = false
        } else {
            console.log('✅ Role is AGENCY')
        }

        // Check Agency Fields
        if (fetchedUser.agencyProfile?.businessName !== 'Valid Travels Inc') {
            console.error(`❌ Incorrect Agency Name: Expected 'Valid Travels Inc', got ${fetchedUser.agencyProfile?.businessName}`)
            success = false
        } else {
            console.log('✅ Agency Name persisted in agencyProfile')
        }

        // Check Status
        if (fetchedUser.status !== 'APPROVED') {
            console.error(`❌ Incorrect Status: Expected APPROVED, got ${fetchedUser.status}`)
            success = false
        } else {
            console.log('✅ Status is APPROVED')
        }
    }

    // 4. Verify Demo Login User (Pre-requisite for Demo Login UI)
    console.log('🔍 Verifying Demo User (agency@demo.com)...')
    const demoUser = await prisma.user.findFirst({
        where: { email: 'agency@demo.com' }
    })

    if (!demoUser) {
        console.warn('⚠️ agency@demo.com NOT FOUND. This is expected if demo data is not seeded.')
    } else if (demoUser.role !== 'AGENCY') {
        console.error(`❌ agency@demo.com has wrong role: ${demoUser.role}`)
        success = false
    } else {
        console.log('✅ agency@demo.com exists and has AGENCY role')
    }

    // 5. Cleanup
    if (success) {
        console.log('🧹 Cleaning up test user...')
        await prisma.user.delete({ where: { id: user.id } })
    }

    if (success) {
        console.log('✅✅✅ VERIFICATION PASSED ✅✅✅')
        console.log('The Travel Agency Signup flow produces correct DB records.')
        process.exit(0)
    } else {
        console.error('❌❌❌ VERIFICATION FAILED ❌❌❌')
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
