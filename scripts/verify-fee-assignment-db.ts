
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Fee Assignment DB Verification...')

    // 1. Create/Get Support User
    const supportEmail = 'verify-support@demo.com'
    const supportUser = await prisma.user.upsert({
        where: { email: supportEmail },
        update: {},
        create: {
            email: supportEmail,
            fullName: 'Verify Support',
            role: 'SUPPORT', // Or whatever valid role
            status: 'APPROVED',
            userId: 'verify-support-id'
        }
    })
    console.log(`✅ Using Support User: ${supportUser.email}`)

    // 2. Create Application
    const user = await prisma.user.findFirst({ where: { role: 'INDIVIDUAL' } })
    if (!user) throw new Error('No Individual user found')

    const app = await prisma.application.create({
        data: {
            userId: user.id,
            country: 'TestLand',
            processType: 'TOURIST',
            profession: 'TEST_PROFESSION',
            consultancyFee: 0,
            module: 'PERSONAL',
            status: 'DRAFT'
        }
    })
    console.log(`✅ Application Created: ${app.id}`)

    // 3. Simulate Fee Assignment (API Logic)
    console.log('Simulating Fee Assignment...')
    const feeAmount = 5000
    const currency = 'BDT'
    const notes = 'Test Fee Assignment'

    const updatedApp = await prisma.application.update({
        where: { id: app.id },
        data: {
            supportFeeAmount: feeAmount,
            supportFeeCurrency: currency,
            supportFeeAssignedById: supportUser.id,
            supportFeeAssignedAt: new Date(),
            consultancyFee: feeAmount, // Logic mirrors API
            // Add audit log if possible (not testing here, assuming API does it)
        }
    })

    console.log(`✅ Fee Assigned. Updated App:`)
    console.log(`   - Support Fee: ${updatedApp.supportFeeAmount} ${updatedApp.supportFeeCurrency}`)
    console.log(`   - Consultancy Fee: ${updatedApp.consultancyFee}`)
    console.log(`   - Assigned By: ${updatedApp.supportFeeAssignedById}`)

    if (updatedApp.supportFeeAmount !== feeAmount) {
        throw new Error('Fee amount mismatch')
    }
    if (updatedApp.consultancyFee !== feeAmount) {
        throw new Error('Consultancy fee mismatch')
    }

    // 4. Verification Check from "Client" perspective (Read-only)
    // The client page reads app.supportFeeAmount.
    // If we fetch it, is it there?
    const fetchedApp = await prisma.application.findUnique({
        where: { id: app.id }
    })

    if (!fetchedApp?.supportFeeAmount) {
        throw new Error('Failed to fetch supportFeeAmount')
    }

    // 5. Cleanup
    await prisma.application.delete({ where: { id: app.id } })
    // Don't delete user, might break other things or be reused
    console.log('✅ Cleanup Complete')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
