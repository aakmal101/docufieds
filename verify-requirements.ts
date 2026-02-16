
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying Document Requirements per Module...')

    // Count by Module
    const counts = await prisma.documentRequirement.groupBy({
        by: ['module'],
        _count: true
    })

    console.log('Requirements by Module:')
    console.log(JSON.stringify(counts, null, 2))

    // List distinct documents for PERSONAL and GLOBAL
    const personalReqs = await prisma.documentRequirement.findMany({
        where: { module: 'PERSONAL' },
        select: { documentType: true }
    })
    console.log('PERSONAL Requirements:', personalReqs.map(r => r.documentType))

    const globalReqs = await prisma.documentRequirement.findMany({
        where: { module: null },
        select: { documentType: true }
    })
    console.log('GLOBAL Requirements:', globalReqs.map(r => r.documentType))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
