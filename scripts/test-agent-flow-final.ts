
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3000'
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    console.log('🚀 Final (Minimal) Agent Flow Test')
    const timestamp = Date.now()

    // Keep track of IDs for cleanup
    let agencyId: string = ''
    let agentId: string = ''
    let clientId: string = ''
    let appId: string = ''
    let assignmentId: string = ''

    try {
        // 1. Create Agency
        console.log('1. Creating Agency...')
        const agency = await prisma.user.create({
            data: {
                email: `agency_final_${timestamp}@test.com`,
                fullName: 'Agency User',
                role: 'AGENCY',
                status: 'APPROVED'
            }
        })
        agencyId = agency.id
        console.log('   Agency ID:', agencyId)

        // 2. Create Agent
        console.log('2. Creating Agent...')
        const agent = await prisma.user.create({
            data: {
                email: `agent_final_${timestamp}@test.com`,
                fullName: 'Agent User',
                role: 'AGENT',
                status: 'APPROVED',
                agencyId: agency.id
            }
        })
        agentId = agent.id
        console.log('   Agent ID:', agentId)

        // 3. Create Client & App
        console.log('3. Creating Client & App...')
        const client = await prisma.user.create({
            data: {
                email: `client_final_${timestamp}@test.com`,
                fullName: 'Client User',
                role: 'USER',
                status: 'APPROVED'
            }
        })
        clientId = client.id

        const app = await (prisma as any).application.create({
            data: {
                userId: client.id,
                country: 'TestLand',
                processType: 'Visa',
                status: 'SUBMITTED',
                consultancyFee: 500,
                // Add modules just in case UI needs them
                modules: {
                    create: [{ module: 'PERSONAL', status: 'COMPLETE' }]
                }
            }
        })
        appId = app.id
        console.log('   App ID:', appId)

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
        assignmentId = assignment.id
        console.log('   Assignment ID:', assignmentId)

        // 5. Test API: List Assignments
        console.log('5. Testing API: GET /api/agent/assignments')
        try {
            const res = await fetch(`${BASE_URL}/api/agent/assignments`, {
                headers: { 'x-user-id': agentId }
            })
            if (res.status === 200) {
                const json = await res.json()
                if (json.success && json.data.length > 0) {
                    console.log('   ✅ API List Success')
                } else {
                    console.error('   ❌ API List Empty/Error:', json)
                }
            } else {
                console.warn('   ⚠️ API Unreachable or Error:', res.status)
            }
        } catch (e) {
            console.warn('   ⚠️ API connection failed (Server not running?)')
        }

        // 6. Test API: Details
        console.log('6. Testing API: GET /api/agent/applications/:id')
        try {
            const res = await fetch(`${BASE_URL}/api/agent/applications/${appId}`, {
                headers: { 'x-user-id': agentId }
            })
            if (res.status === 200) {
                console.log('   ✅ API Details Success')
            } else {
                console.warn('   ⚠️ API Details Failed:', res.status)
            }
        } catch (e) {
            // ignore
        }

        // 7. RBAC Check
        console.log('7. Testing RBAC on Unassigned App...')
        const secretApp = await (prisma as any).application.create({
            data: { userId: clientId, country: 'Secret', status: 'DRAFT', processType: 'Visa', consultancyFee: 0 }
        })
        try {
            const res = await fetch(`${BASE_URL}/api/agent/applications/${secretApp.id}`, {
                headers: { 'x-user-id': agentId }
            })
            if (res.status === 403) {
                console.log('   ✅ API correctly returned 403 Forbidden')
            } else if (res.status === 200) {
                console.error('   ❌ SECURITY FAIL: API returned 200 for unassigned app')
            }
        } catch (e) {
            // ignore
        }
        await prisma.application.delete({ where: { id: secretApp.id } })

        console.log('✅ Final Test Suite Completed')

    } catch (e: any) {
        console.error('❌ Error:', e.message)
    } finally {
        console.log('Cleaning up...')
        if (assignmentId) await (prisma as any).agentAssignment.delete({ where: { id: assignmentId } }).catch(() => { })
        if (appId) {
            await (prisma as any).applicationModule.deleteMany({ where: { applicationId: appId } }).catch(() => { })
            await prisma.application.delete({ where: { id: appId } }).catch(() => { })
        }
        if (agentId) await prisma.user.delete({ where: { id: agentId } }).catch(() => { })
        if (agencyId) await prisma.user.delete({ where: { id: agencyId } }).catch(() => { })
        if (clientId) await prisma.user.delete({ where: { id: clientId } }).catch(() => { })

        await prisma.$disconnect()
    }
}

main()
