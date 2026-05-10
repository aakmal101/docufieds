import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const user = await getCurrentUser()

        if (!user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const resolvedParams = params instanceof Promise ? await params : params
        const applicationId = resolvedParams.id
        const body = await request.json()
        const { answers } = body

        if (!answers || typeof answers !== 'object') {
            return NextResponse.json(
                { success: false, message: 'Invalid payload: answers object required' },
                { status: 400 }
            )
        }

        // Verify application exists and belongs to user
        const application = await prisma.application.findFirst({
            where: {
                id: applicationId,
                userId: user!.id,
            },
        })

        if (!application) {
            return NextResponse.json(
                { success: false, message: 'Application not found or unauthorized' },
                { status: 404 }
            )
        }

        // Process upserts sequentially to prevent deadlocks on concurrent writes to the same application
        const results = []
        for (const [key, value] of Object.entries(answers)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

            // Use upsert to create or update the answer
            const result = await prisma.applicationAnswer.upsert({
                where: {
                    applicationId_module_fieldKey: {
                        applicationId,
                        module: 'BUSINESS',
                        fieldKey: key,
                    }
                },
                update: {
                    value: stringValue,
                },
                create: {
                    applicationId,
                    module: 'BUSINESS',
                    fieldKey: key,
                    value: stringValue,
                },
            })
            results.push(result)
        }

        return NextResponse.json({
            success: true,
            message: 'Answers updated successfully',
            data: results,
        })
    } catch (error: any) {
        console.error('[Answers API] Error:', error)
        return NextResponse.json(
            {
                success: false,
                message: error?.message || 'Internal server error',
            },
            { status: 500 }
        )
    }
}
