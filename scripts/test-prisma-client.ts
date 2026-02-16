
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Testing Prisma Client ---')

    // Check property existence
    console.log('1. Checking prisma.agentAssignment presence...')
    const agentAssignmentProp = (prisma as any).agentAssignment
    console.log('   prisma.agentAssignment type:', typeof agentAssignmentProp)

    if (!agentAssignmentProp) {
        console.error('   ❌ FAILED: agentAssignment is undefined')
    } else {
        console.log('   ✅ SUCCESS: agentAssignment is defined')
    }

    // Check DB Connection & Raw Query
    console.log('2. Testing Raw Query...')
    try {
        await prisma.$queryRaw`SELECT 1`
        console.log('   ✅ DB Connection OK')
    } catch (e) {
        console.error('   ❌ DB Connection Failed:', e)
    }

    // Check Table Existence
    console.log('3. Checking agent_assignments table...')
    try {
        await prisma.$queryRaw`SELECT count(*) FROM agent_assignments`
        console.log('   ✅ Table agent_assignments queryable')
    } catch (e) {
        console.error('   ❌ Table agent_assignments query failed:', e)
    }

    console.log('--- End of Test ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
