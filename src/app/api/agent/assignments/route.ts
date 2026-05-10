
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // 1. Auth — use Supabase Auth (proper auth)
        const user = await getCurrentUser()
        if (!user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const userId = user!.id

        // Verify user is an AGENT
        if (user!.role !== 'AGENT') {
            return NextResponse.json({ success: false, message: 'Forbidden: Agent role required' }, { status: 403 })
        }

        // 2. Fetch all ACTIVE assignments with application + user + documents
        const assignments = await (prisma as any).agentAssignment.findMany({
            where: {
                agentUserId: userId,
                status: 'ACTIVE'
            },
            include: {
                targetUser: {
                    select: { id: true, fullName: true, email: true, phone: true }
                },
                application: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true }
                        },
                        documents: {
                            select: {
                                id: true,
                                fileName: true,
                                documentType: true,
                                status: true,
                                uploadedAt: true
                            }
                        },
                        modules: {
                            select: { module: true, status: true }
                        },
                        uploadSessions: {
                            select: {
                                id: true,
                                status: true,
                                slotCount: true,
                                expiresAt: true,
                                createdAt: true,
                                slots: {
                                    select: {
                                        id: true,
                                        slotIndex: true,
                                        label: true,
                                        status: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // 3. Compute dashboard stats from assignments
        const apps: any[] = assignments
            .filter((a: any) => a.application)
            .map((a: any) => a.application!)

        const totalApplications: number = apps.length
        const completed = apps.filter(a => a.status === 'COMPLETED').length
        const inProgress = apps.filter(a =>
            ['UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW', 'DOCUMENT_UNDER_PROCESSING'].includes(a.status)
        ).length
        const pendingReview = apps.filter(a =>
            ['DRAFT', 'SUBMITTED'].includes(a.status)
        ).length

        // Unique users across all assignments
        const userIds = new Set<string>()
        assignments.forEach((a: any) => {
            if (a.targetUser?.id) userIds.add(a.targetUser.id)
            if (a.application?.user?.id) userIds.add(a.application.user.id)
        })
        const totalUsers = userIds.size

        // Pending documents: count docs with status PENDING across all assigned apps
        const pendingDocuments = apps.reduce((count: number, app: any) => {
            return count + (app.documents?.filter((d: any) => d.status === 'PENDING').length || 0)
        }, 0)

        const stats = {
            totalApplications,
            completed,
            inProgress,
            pendingReview,
            totalUsers,
            pendingDocuments
        }

        return NextResponse.json({
            success: true,
            data: { stats, assignments }
        })

    } catch (error: any) {
        console.error('Agent assignments error:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
