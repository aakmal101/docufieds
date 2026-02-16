
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    console.log('🚀 Minimal Agent Flow Test')

    const timestamp = Date.now()

    try {
        // 1. Agency
        console.log('1. Creating Agency...')
        const agency = await prisma.user.create({
            data: {
                email: `agency_${timestamp}@test.com`,
                fullName: 'Agency',
                role: 'AGENCY',
                status: 'APPROVED'
            }
        })
        console.log('   Agency ID:', agency.id)

        // 2. Agent
        console.log('2. Creating Agent...')
        const agent = await prisma.user.create({
            data: {
                email: `agent_${timestamp}@test.com`,
                fullName: 'Agent',
                role: 'AGENT',
                status: 'APPROVED',
                agencyId: agency.id
            }
        })
        console.log('   Agent ID:', agent.id)

        // 3. Client & App
        console.log('3. Creating Client & App...')
        const client = await prisma.user.create({
            data: {
                email: `client_${timestamp}@test.com`,
                fullName: 'Client',
                role: 'USER',
                status: 'APPROVED'
            }
        })

        // Use casting if needed, but try without first
        const app = await (prisma as any).application.create({
            data: {
                userId: client.id,
                country: 'TestLand',
                processType: 'Visa',
                status: 'DRAFT',
                consultancyFee: 500
            }
        })
        console.log('   App ID:', app.id)

        // 4. Assign
        console.log('4. Assigning...')
        const assignment = await (prisma as any).agentAssignment.create({
            data: {
                agentUserId: agent.id,
                applicationId: app.id,
                assignedByUserId: agency.id,
                status: 'ACTIVE'
            }
        })
        console.log('   Assignment ID:', assignment.id)

        console.log('✅ Minimal Flow Success')

        // Clean up
        await (prisma as any).agentAssignment.delete({ where: { id: assignment.id } })
        await prisma.application.delete({ where: { id: app.id } })
        await prisma.user.deleteMany({ where: { id: { in: [agency.id, agent.id, client.id] } } })

    } catch (e: any) {
        console.error('❌ Failed:', e.message)
        // console.error(e) // Avoid printing huge object
    } finally {
        await prisma.$disconnect()
    }
}

main()
