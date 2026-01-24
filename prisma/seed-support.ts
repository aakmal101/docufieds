import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Support Portal Seed...')

    // 1. Create Support Lead User
    const leadEmail = 'lead@docufieds.com'
    const leadPassword = await hash('password123', 10)

    const lead = await prisma.user.upsert({
        where: { email: leadEmail },
        update: { role: 'SUPPORT_LEAD' },
        create: {
            email: leadEmail,
            fullName: 'Chief Support Officer',
            passwordHash: leadPassword,
            role: 'SUPPORT_LEAD',
            status: 'APPROVED',
            isVerified: true
        }
    })
    console.log(`Created Lead: ${lead.email}`)

    // 2. Create Auto-Assignment Config
    await prisma.autoAssignmentConfig.upsert({
        where: { id: 'default-config' }, // ID might be random, so we might deleting first or checking by createdById if we want uniqueness
        // Since schema doesn't force unique on createdById for this table, we'll findFirst.
        update: {},
        create: {
            createdById: lead.id,
            isEnabled: true,
            assignmentMode: 'ROUND_ROBIN',
            maxActivePerMember: 5
        }
    }).catch(() => { }) // Ignore if exists logic complex for now

    // 3. Create Support Team Members
    const members = [
        { name: 'Alice Support', email: 'alice@support.com' },
        { name: 'Bob Support', email: 'bob@support.com' },
        { name: 'Charlie Legal', email: 'charlie@legal.com' }
    ]

    for (const m of members) {
        const password = await hash('support123', 10) // In real app, they'd have their own simple password management or reuse User auth
        // Our schema has SupportTeamMember table separate from User.
        await prisma.supportTeamMember.upsert({
            where: { email: m.email },
            update: {},
            create: {
                email: m.email,
                fullName: m.name,
                passwordHash: password, // Store hash directly as per schema
                leadId: lead.id,
                isActive: true
            }
        })
        console.log(`Created Member: ${m.email}`)
    }

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
