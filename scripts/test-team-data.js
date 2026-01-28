const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Testing Prisma Connection for Team Members...')
    try {
        const count = await prisma.supportTeamMember.count()
        console.log(`Total count: ${count}`)

        const members = await prisma.supportTeamMember.findMany({
            // Mimic the API query
            select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                leadId: true
            }
        })
        console.log('Members:', JSON.stringify(members, null, 2))
    } catch (error) {
        console.error('Error fetching members:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
