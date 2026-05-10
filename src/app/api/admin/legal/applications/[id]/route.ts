import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLegal } from '@/lib/auth/admin-guard'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await requireLegal()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                status: true,
                supportStatus: true,
                createdAt: true,
                forwardedToLegalAt: true,
                country: true,
                processType: true,
                profession: true,
                user: {
                    select: {
                        email: true,
                        photoUrl: true,
                        individualProfile: {
                            select: { firstName: true, lastName: true, phoneNumber: true }
                        }
                    }
                },
                // Include documents (Both applicant provided and legal output)
                documents: {
                    orderBy: { uploadedAt: 'desc' }
                },
                // Notes/Activity Log - Reuse StatusUpdates or Messages?
                // Using StatusUpdates for history
                statusUpdates: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                // Messages for context (Internal/Support)
                // Filter where it's internal or system? Legal needs to communicate with Lead.
                // We'll expose all support messages for context, minus strictly private ones if any
                supportMessages: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        senderUser: { select: { email: true, individualProfile: { select: { firstName: true, lastName: true } } } }
                    }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        return NextResponse.json(application)

    } catch (error) {
        console.error('[API] Legal App Detail Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
