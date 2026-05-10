
import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting Demo User Seeding...')

    const password = await hash('password123', 10)

    const demoUsers = [
        {
            email: 'individual@demo.com',
            role: Role.INDIVIDUAL,
            firstName: 'Demo',
            lastName: 'Individual',
            phone: '+8801700000001'
        },
        {
            email: 'agency@demo.com',
            role: Role.AGENCY,
            firstName: 'Demo Travel',
            lastName: 'Agency',
            businessName: 'Demo Travels Ltd.',
            licenseNumber: 'TR-123456',
            phone: '+8801700000002'
        },
        {
            email: 'admin@demo.com',
            role: Role.ADMIN,
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+8801700000003'
        },
        {
            email: 'support@demo.com',
            role: Role.SUPPORT,
            firstName: 'Support',
            lastName: 'Agent',
            phone: '+8801700000004'
        },
        {
            email: 'legal@demo.com',
            role: Role.LEGAL,
            firstName: 'Legal',
            lastName: 'Officer',
            phone: '+8801700000005'
        },
        {
            email: 'accounts@demo.com',
            role: Role.ACCOUNTS,
            firstName: 'Accounts',
            lastName: 'Officer',
            phone: '+8801700000006'
        }
    ]

    for (const userData of demoUsers) {
        const existing = await prisma.user.findFirst({
            where: { email: userData.email }
        })

        if (!existing) {
            await prisma.user.create({
                data: {
                    email: userData.email,
                    role: userData.role,
                    status: 'APPROVED',
                    isVerified: true,
                    passwordHash: password,
                    dateOfBirth: new Date('1990-01-01'),
                    placeOfBirth: 'Dhaka',
                    individualProfile: {
                        create: {
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            phoneNumber: userData.phone
                        }
                    },
                    ...(userData.role === Role.AGENCY ? {
                        agencyProfile: {
                            create: {
                                businessName: userData.businessName,
                                licenseNumber: userData.licenseNumber,
                                status: 'ACTIVE'
                            }
                        }
                    } : {}),
                    ...(userData.role === Role.SUPPORT ? {
                        supportProfile: {
                            create: {
                                department: 'General Support'
                            }
                        }
                    } : {})
                }
            })
            console.log(`✅ Created demo user: ${userData.email} (${userData.role})`)
        } else {
            console.log(`ℹ️ User already exists: ${userData.email}`)
            // Update role just in case
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: userData.role
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
