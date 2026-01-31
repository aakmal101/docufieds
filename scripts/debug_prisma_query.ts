
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- STARTING PRISMA QUERY DEBUG ---')
    try {
        const whereClause: any = {
            status: { not: 'DRAFT' }
        }

        console.log('Querying with clause:', JSON.stringify(whereClause))

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                user: { select: { fullName: true, email: true } },
                _count: { select: { documents: true } },
                payments: {
                    select: { status: true, amount: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                assignment: {
                    include: {
                        member: { select: { fullName: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 1,
        })

        console.log('--- SUCCESS ---')
        console.log(`Found ${applications.length} applications`)
        if (applications.length > 0) {
            console.log('Sample Assignment:', JSON.stringify(applications[0].assignment, null, 2))
        }

    } catch (error) {
        console.error('--- QUERY FAILED ---')
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
