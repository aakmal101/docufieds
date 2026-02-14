import { prisma } from '../src/lib/prisma'

async function main() {
    try {
        console.log('Testing database connection...')
        const userCount = await prisma.user.count()
        console.log(`Connection successful! User count: ${userCount}`)
    } catch (error) {
        console.error('Connection failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
