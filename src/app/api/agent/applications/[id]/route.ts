
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { assertAgentAccess } from '@/lib/require-agent-access'

export const dynamic = 'force-dynamic'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const applicationId = resolvedParams.id

        // 1. Auth — use Supabase Auth
        const user = await getCurrentUser()
        if (!user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (user!.role !== 'AGENT') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        // 2. Verify assignment using shared helper
        await assertAgentAccess(applicationId, user!.id)

        // 3. Fetch application with full details
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, phone: true }
                },
                documents: {
                    select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        fileType: true,
                        fileSize: true,
                        documentType: true,
                        status: true,
                        isRequired: true,
                        uploadedAt: true
                    }
                },
                modules: {
                    select: { module: true, status: true }
                },
                supportMessages: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                uploadSessions: {
                    include: {
                        slots: {
                            orderBy: { slotIndex: 'asc' },
                            include: {
                                uploadedDocument: {
                                    select: {
                                        id: true,
                                        fileName: true,
                                        fileSize: true,
                                        uploadedAt: true
                                    }
                                }
                            }
                        },
                        createdByUser: {
                            select: { fullName: true }
                        }
                    }
                }
            } as any
        })

        if (!application) {
            return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 })
        }

        // 4. Add support fee info (read-only) 
        const appData = {
            ...application,
            supportFeeAmount: (application as any).supportFeeAmount || null,
            supportFeeCurrency: (application as any).supportFeeCurrency || 'BDT',
        }

        return NextResponse.json({ success: true, data: appData })

    } catch (error: any) {
        if (error.status === 403) {
            return NextResponse.json({ success: false, message: error.message }, { status: 403 })
        }
        console.error('Agent application detail error:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
