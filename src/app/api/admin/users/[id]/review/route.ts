import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProfileReviewer } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await requireProfileReviewer()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                individualProfile: { select: { firstName: true, lastName: true, phoneNumber: true, passportNumber: true } },
                email: true,
                dateOfBirth: true,
                placeOfBirth: true,
                nationality: true,

                nidNumber: true,
                birthCertificateNumber: true,
                presentAddress: true,
                permanentAddress: true,
                photoUrl: true,
                profileStatus: true,
                createdAt: true,
                role: true,
                // Stats context
                _count: {
                    select: {
                        applications: true,
                        documents: true
                    }
                },
                // Audit Trail
                targetAuditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        actor: {
                            select: { individualProfile: { select: { firstName: true, lastName: true } }, email: true }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)

    } catch (error) {
        console.error('[API] User Review Detail Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
