
import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Support Portal Seed...')

    const password = await hash('password123', 10)

    // 1. Create Lead User
    const leadEmail = 'lead@docufieds.com'
    const lead = await prisma.user.upsert({
        where: { email: leadEmail },
        update: { role: Role.ADMIN }, // Using ADMIN or SUPPORT for Lead role
        create: {
            email: leadEmail,
            role: Role.ADMIN,
            status: 'APPROVED',
            isVerified: true,
            passwordHash: password,
            individualProfile: {
                create: {
                    firstName: 'Chief',
                    lastName: 'Support Officer'
                }
            }
        }
    })
    console.log(`Created Lead: ${lead.email}`)

    // 2. Create Support Team Members (as Users with role SUPPORT)
    const members = [
        { firstName: 'Alice', lastName: 'Support', email: 'alice@support.com' },
        { firstName: 'Bob', lastName: 'Support', email: 'bob@support.com' },
        { firstName: 'Charlie', lastName: 'Legal', email: 'charlie@legal.com', role: Role.LEGAL }
    ]

    for (const m of members) {
        await prisma.user.upsert({
            where: { email: m.email },
            update: {},
            create: {
                email: m.email,
                role: m.role || Role.SUPPORT,
                status: 'APPROVED',
                isVerified: true,
                passwordHash: password,
                individualProfile: {
                    create: {
                        firstName: m.firstName,
                        lastName: m.lastName
                    }
                },
                ...( (m.role || Role.SUPPORT) === Role.SUPPORT ? {
                    supportProfile: {
                        create: {
                            department: 'Customer Support'
                        }
                    }
                } : {})
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
