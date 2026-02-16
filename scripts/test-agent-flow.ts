
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3000'
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    console.log('🚀 Starting Safe E2E Test: Agent Dashboard Flow...')

    const timestamp = Date.now()
    const agencyEmail = `agency_${timestamp}@test.com`
    const agentEmail = `agent_${timestamp}@test.com`
    const clientEmail = `client_${timestamp}@test.com`

    try {
        // 1. Setup Agency & Agent
        console.log('1. Setting up Users (Agency + Agent)...')

        const agencyUser = await prisma.user.create({
            data: {
                email: agencyEmail,
                fullName: 'Test Agency',
                role: 'AGENCY',
                status: 'APPROVED',
                isVerified: true,
                agencyName: 'Test Agency Ltd',
                agencyLicense: 'LIC-123'
            }
        })

        const agentUser = await prisma.user.create({
            data: {
                email: agentEmail,
                fullName: 'Test Agent 007',
                role: 'AGENT',
                status: 'APPROVED',
                isVerified: true,
                agencyId: agencyUser.id,
                agentProfile: {
                    create: {
                        displayName: 'Agent 007',
                        phone: '555-0199'
                    }
                }
            },
            include: { agentProfile: true }
        })
        console.log(`   ✅ Agent Created: ${agentUser.email} (${agentUser.id})`)
        await delay(100)

        // 2. Setup Client & Application
        console.log('2. Setting up Client & Application...')
        const clientUser = await prisma.user.create({
            data: {
                email: clientEmail,
                fullName: 'Test Client',
                role: 'USER',
                status: 'APPROVED',
                isVerified: true
            }
        })

        const testApp = await (prisma as any).application.create({
            data: {
                userId: clientUser.id,
                country: 'TestLand',
                processType: 'Visa', // Correct field name
                consultancyFee: 500,
                status: 'SUBMITTED',
                modules: {
                    create: [
                        { module: 'PERSONAL', status: 'COMPLETE' },
                        { module: 'BUSINESS', status: 'IN_PROGRESS' }
                    ]
                }
            }
        })
        console.log(`   ✅ Client App Created: ${testApp.id}`)
        await delay(100)

        // 3. Assign Application to Agent
        console.log('3. Assigning Application to Agent...')

        console.log('   Debug: Checking table existence via raw query...')
        try {
            await prisma.$queryRaw`SELECT 1 FROM agent_assignments LIMIT 1`
            console.log('   ✅ Table agent_assignments exists')
        } catch (e) {
            console.error('   ❌ Table agent_assignments DOES NOT EXIST or error:', e)
        }

        console.log('   Debug: prisma.agentAssignment is', (prisma as any).agentAssignment ? 'defined' : 'undefined')
        if (!(prisma as any).agentAssignment) {
            console.error('   ❌ prisma.agentAssignment is UNDEFINED. Trying to reload client...')
            // We can't really reload here easily.
        }
        // Use API if running, else direct DB
        // We'll use DB for setup to ensure prereqs
        let assignment;
        try {
            assignment = await (prisma as any).agentAssignment.create({
                data: {
                    agentUserId: agentUser.id,
                    applicationId: testApp.id,
                    assignedByUserId: agencyUser.id,
                    status: 'ACTIVE'
                }
            })
            console.log(`   ✅ Assignment Created: ${assignment.id}`)
        } catch (assignError: any) {
            console.error('   ❌ Assignment Creation Failed!', assignError.code, assignError.message)
            throw assignError
        }

        // 4. Test Agent API: List Assignments
        console.log('4. Testing API: GET /api/agent/assignments...')
        try {
            const res = await fetch(`${BASE_URL}/api/agent/assignments`, {
                headers: { 'x-user-id': agentUser.id }
            })
            if (res.status === 200) {
                const data = await res.json()
                if (data.success && data.data.length > 0) {
                    console.log('   ✅ API returned assignments correctly')
                    const fetchedAssignment = data.data.find((a: any) => a.id === assignment.id)
                    if (fetchedAssignment) {
                        console.log('   ✅ Found the specific assignment')
                    } else {
                        console.error('   ❌ Assignment not found in list')
                    }
                } else {
                    console.error('   ❌ API returned empty or unsuccessful response', data)
                }
            } else {
                console.warn(`   ⚠️ API Request failed with status ${res.status}. Is server running?`)
            }
        } catch (e) {
            console.warn('   ⚠️ Could not reach API. Skipping API verification.')
        }

        // 5. Test Agent API: Get Application details
        console.log('5. Testing API: GET /api/agent/applications/[id]...')
        try {
            const res = await fetch(`${BASE_URL}/api/agent/applications/${testApp.id}`, {
                headers: { 'x-user-id': agentUser.id }
            })
            if (res.status === 200) {
                const data = await res.json()
                if (data.success && data.data.id === testApp.id) {
                    console.log('   ✅ API returned application details')
                } else {
                    console.error('   ❌ API returned wrong data')
                }
            } else {
                console.warn(`   ⚠️ API Request failed with status ${res.status}`)
            }
        } catch (e) {
            console.warn('   ⚠️ Skipping API verification.')
        }

        // 6. Test RBAC: Try to fetch unassigned app
        console.log('6. Testing RBAC: Fetch Unassigned App...')
        // Create another app unassigned
        const unassignedApp = await (prisma as any).application.create({
            data: {
                userId: clientUser.id,
                country: 'SecretLand',
                processType: 'TopSecret',
                status: 'DRAFT'
            }
        })

        try {
            const res = await fetch(`${BASE_URL}/api/agent/applications/${unassignedApp.id}`, {
                headers: { 'x-user-id': agentUser.id }
            })
            if (res.status === 403) {
                console.log('   ✅ API correctly returned 403 Forbidden for unassigned app')
            } else if (res.status === 200) {
                console.error('   ❌ API returned 200 OK for unassigned app! SECURITY FAIL!')
            } else {
                console.warn(`   ⚠️ API returned ${res.status}`)
            }
        } catch (e) {
            // ignore
        }

        // 7. Test Message Sending
        console.log('7. Testing API: POST /api/agent/messages...')
        try {
            const res = await fetch(`${BASE_URL}/api/agent/messages`, {
                method: 'POST',
                headers: {
                    'x-user-id': agentUser.id,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    applicationId: testApp.id,
                    content: 'Hello from Agent Test Script',
                    messageType: 'TEXT'
                })
            })
            if (res.status === 200) {
                const data = await res.json()
                if (data.success) {
                    console.log('   ✅ Message sent successfully via API')
                } else {
                    console.error('   ❌ Failed to send message:', data)
                }
            } else {
                console.warn(`   ⚠️ API returned ${res.status}`)
            }
        } catch (e) {
            console.warn('   ⚠️ Skipping API verification.')
        }

        // Cleanup
        console.log('8. Cleanup...')
        await (prisma as any).agentAssignment.deleteMany({ where: { agentUserId: agentUser.id } })
        await (prisma as any).supportMessage.deleteMany({ where: { senderUserId: agentUser.id } })
        await (prisma as any).applicationModule.deleteMany({ where: { applicationId: testApp.id } })
        await prisma.application.delete({ where: { id: testApp.id } })
        await prisma.application.delete({ where: { id: unassignedApp.id } })
        await prisma.agentProfile.delete({ where: { userId: agentUser.id } })
        await prisma.user.delete({ where: { id: agentUser.id } })
        await prisma.user.delete({ where: { id: agencyUser.id } })
        await prisma.user.delete({ where: { id: clientUser.id } })

        console.log('✅ Test Suite Completed')

    } catch (error) {
        console.error('❌ Test Failed with error:', error)
        if (error instanceof Error) console.error(error.stack)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
