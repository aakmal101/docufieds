import { createMocks } from 'node-mocks-http'
import { GET as getBilling } from '@/app/api/agency/billing/route'
import { GET as getCreditStatus } from '@/app/api/agency/credit/status/route'
import prisma from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    payment: {
        count: jest.fn(),
        findMany: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(() => Promise.resolve({
        user: {
            id: 'test-user-id',
            role: 'AGENCY'
        }
    }))
}))

// Mock NextResponse
jest.mock('next/server', () => {
    return {
        NextResponse: {
            json: (body: any, init?: any) => {
                return {
                    status: init?.status || 200,
                    json: async () => body,
                }
            },
        },
        NextRequest: class MockNextRequest {
            url: string
            constructor(url: string) {
                this.url = url
            }
        }
    }
})

describe('Agency API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        require('next-auth').getServerSession.mockResolvedValue({
            user: { id: 'test-user-id', role: 'AGENCY' }
        })
    })

    describe('/api/agency/billing', () => {
        it('returns 401 if not authorized', async () => {
            // Override mock for this test
            require('next-auth').getServerSession.mockResolvedValueOnce(null)

            const { req } = createMocks({
                method: 'GET',
                url: 'http://localhost:3000/api/agency/billing'
            })

            const response = await getBilling(req as any)
            expect(response.status).toBe(401)
        })

        it('returns billing history for authenticated agency', async () => {
            (prisma.payment.count as jest.Mock).mockResolvedValue(1);
            (prisma.payment.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'pay_1',
                    amount: 100,
                    status: 'PAID',
                    invoiceNumber: 'INV-001',
                    createdAt: new Date(),
                    application: {
                        country: 'USA'
                    }
                }
            ])

            const { req } = createMocks({
                method: 'GET',
                url: 'http://localhost:3000/api/agency/billing?page=1',
                query: { page: '1' }
            })

            const response = await getBilling(req as any)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toHaveLength(1)
            expect(data.data[0].invoiceNumber).toBe('INV-001')
        })
    })

    describe('/api/agency/credit/status', () => {
        it('returns credit status', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                creditLimit: 5000,
                outstandingAmount: 1000,
                documentLimit: 10,
                documentsUsed: 5,
                nextPaymentDue: new Date('2025-01-30')
            })

            const response = await getCreditStatus()
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data.availableCredit).toBe(4000)
            expect(data.data.documentsRemaining).toBe(5)
            expect(data.data.creditUsagePercent).toBe(20)
        })
    })
})
