
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> | { token: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params
        const rawToken = resolvedParams.token

        if (!rawToken) {
            return NextResponse.json({ success: false, message: 'Token required' }, { status: 400 })
        }

        // Hash token to lookup
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        const session = await (prisma as any).uploadSession.findUnique({
            where: { tokenHash },
            include: {
                createdByUser: {
                    select: { fullName: true }
                },
                targetUser: {
                    select: { fullName: true }
                },
                slots: {
                    orderBy: { slotIndex: 'asc' },
                    select: {
                        id: true,
                        slotIndex: true,
                        label: true,
                        status: true,
                        documentTypeId: true,
                        uploadedDocument: {
                            select: {
                                id: true,
                                fileName: true,
                                fileSize: true,
                                fileType: true,
                                uploadedAt: true
                            }
                        }
                    }
                }
            }
        })

        if (!session) {
            return NextResponse.json({ success: false, message: 'Invalid or expired link' }, { status: 404 })
        }

        // Check non-active statuses (COMPLETED, EXPIRED, CANCELLED)
        if (session.status === 'COMPLETED') {
            return NextResponse.json({ success: false, message: 'All documents have been uploaded. This link is now closed.' }, { status: 410 })
        }

        if (session.status === 'CANCELLED') {
            return NextResponse.json({ success: false, message: 'This upload link has been cancelled' }, { status: 410 })
        }

        if (session.status === 'EXPIRED') {
            return NextResponse.json({ success: false, message: 'This upload link has expired' }, { status: 410 })
        }

        // Check time-based expiry (even if status is still ACTIVE)
        if (new Date() > new Date(session.expiresAt)) {
            // Atomically mark as EXPIRED
            await (prisma as any).uploadSession.update({
                where: { id: session.id },
                data: { status: 'EXPIRED' }
            })
            return NextResponse.json({ success: false, message: 'This upload link has expired' }, { status: 410 })
        }

        // Return safe public data (only for ACTIVE sessions within expiry)
        return NextResponse.json({
            success: true,
            data: {
                id: session.id,
                requester: session.createdByUser.fullName,
                targetUser: session.targetUser.fullName,
                slotCount: session.slotCount,
                expiresAt: session.expiresAt,
                status: session.status,
                slots: session.slots
            }
        })

    } catch (error: any) {
        console.error('Error validating upload token:', error)
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
