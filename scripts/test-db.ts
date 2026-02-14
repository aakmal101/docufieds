import { prisma } from '../src/lib/prisma'

async function main() {
    try {
        console.log('Testing database connection...')
        const userCount = await prisma.user.count()
        console.log(`Connection successful! User count: ${userCount}`)
    } catch (error: any) {
        console.error('Connection failed details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            clientVersion: error.clientVersion
        })
    } finally {
        await prisma.$disconnect()
    }
}

main()
