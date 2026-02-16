
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting Demo User Seeding...')

    const password = await hash('password123', 10)

    const demoUsers = [
        {
            email: 'individual@demo.com',
            role: 'INDIVIDUAL',
            fullName: 'Demo Individual',
            status: 'APPROVED',
            isVerified: true,
            phone: '+8801700000001'
        },
        {
            email: 'agency@demo.com',
            role: 'AGENCY',
            fullName: 'Demo Travel Agency',
            agencyName: 'Demo Travels Ltd.',
            agencyLicense: 'TR-123456',
            status: 'APPROVED',
            isVerified: true,
            phone: '+8801700000002'
        },
        {
            email: 'admin@demo.com',
            role: 'ADMIN',
            fullName: 'System Administrator',
            status: 'APPROVED',
            isVerified: true,
            phone: '+8801700000003'
        },
        {
            email: 'support@demo.com',
            role: 'SUPPORT',
            fullName: 'Support Agent',
            status: 'APPROVED',
            isVerified: true,
            phone: '+8801700000004'
        },
        {
            email: 'legal@demo.com',
            role: 'LEGAL',
            fullName: 'Legal Officer',
            status: 'APPROVED',
            isVerified: true,
            phone: '+8801700000005'
        },
        {
            email: 'accounts@demo.com',
            role: 'ACCOUNTS',
            fullName: 'Accounts Officer',
            status: 'APPROVED',
            isVerified: true,
            phone: '+8801700000006'
        }
    ]

    for (const user of demoUsers) {
        const existing = await prisma.user.findFirst({
            where: { email: user.email }
        })

        if (!existing) {
            await prisma.user.create({
                data: {
                    ...user,
                    passwordHash: password,
                    dateOfBirth: new Date('1990-01-01'),
                    placeOfBirth: 'Dhaka',
                    // Use 'role' from the object cast to any if necessary, though it matches schema string
                } as any
            })
            console.log(`✅ Created demo user: ${user.email} (${user.role})`)
        } else {
            console.log(`ℹ️ User already exists: ${user.email}`)
            // Update role/agency info just in case
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: user.role,
                    agencyName: user.agencyName,
                    agencyLicense: user.agencyLicense
                }
            })
        }
    }

    console.log('🎉 Demo seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
