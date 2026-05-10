import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSupportLead } from '@/lib/auth/admin-guard'

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const application = await prisma.application.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        email: true,
                        photoUrl: true,
                        individualProfile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phoneNumber: true,
                            }
                        }
                    }
                },
                documents: true,
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                // Include assignment with member workload
                assignment: {
                    include: {
                        assignedTo: {
                            include: {
                                _count: {
                                    select: { assignedApplications: { where: { status: 'ACTIVE' } } }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        return NextResponse.json(application)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await requireSupportLead()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await req.json()
        const { supportStatus, reason, notes } = body

        // Validate allowed statuses for this endpoint
        // status update to INCOMPLETE/NEEDS_RESUBMISSION or back to PENDING
        if (!['NEEDS_RESUBMISSION', 'PENDING_ASSIGNMENT', 'APPROVED'].includes(supportStatus)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const updateData: any = {
            supportStatus,
            lastActivityAt: new Date()
        }

        // If marking incomplete, we might want to log the message/reason
        // We can create a support message or notification

        const application = await prisma.$transaction(async (tx) => {
            const app = await tx.application.update({
                where: { id: params.id },
                data: updateData
            })

            // Add history logic or notification here if complex
            // For MVP, just update status. 
            // If reason provided, maybe add a SupportMessage?

            if (reason) {
                await tx.supportMessage.create({
                    data: {
                        applicationId: params.id,
                        content: reason,
                        messageType: 'STATUS_UPDATE',
                        senderType: 'SYSTEM', // or SUPPORT_LEAD if identified
                        isReadByUser: false
                    }
                })
            }

            return app
        })

        return NextResponse.json(application)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }
}
