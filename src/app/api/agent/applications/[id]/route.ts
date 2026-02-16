
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const applicationId = resolvedParams.id
        const userId = req.headers.get('x-user-id') // Test header or Session ID

        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // 1. Verify Assignment
        const assignment = await prisma.agentAssignment.findFirst({
            where: {
                agentUserId: userId,
                // Match either direct application assignment OR user assignment
                OR: [
                    { applicationId: applicationId },
                    {
                        targetUser: {
                            applications: {
                                some: { id: applicationId }
                            }
                        }
                    }
                ],
                status: 'ACTIVE'
            }
        })

        if (!assignment) {
            return NextResponse.json({ success: false, message: 'Forbidden: Application not assigned' }, { status: 403 })
        }

        // 2. Fetch Application with details
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true }
                },
                documents: true,
                modules: true,
                messageThreads: { // Assuming generic messages or support messages relation
                    // check schema for correct relation name, likely 'supportMessages' or 'messages'
                    // referencing `src/app/api` usage might clarify
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            } as any // cast if messageThreads relation name uncertain
        })

        // Re-fetch with correct relation if needed, checking schema:
        // Application has `supportMessages` and `messages`. 
        // We'll fetch `supportMessages` as that's likely the chat context.

        const appWithMessages = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                user: { select: { id: true, fullName: true } },
                documents: true,
                modules: true,
                supportMessages: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        })

        return NextResponse.json({ success: true, data: appWithMessages })

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
