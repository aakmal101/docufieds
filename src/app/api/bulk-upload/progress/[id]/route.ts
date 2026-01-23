import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const uploadId = params.id;

        const upload = await prisma.bulkUpload.findUnique({
            where: { id: uploadId },
            include: {
                records: {
                    select: {
                        rowNumber: true,
                        status: true,
                        errorMessage: true,
                        warningMessage: true
                    }
                }
            }
        });

        if (!upload) {
            return NextResponse.json(
                { success: false, error: 'Upload not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (upload.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Compile errors from records
        const errors = upload.records
            .filter(r => r.errorMessage)
            .map(r => ({
                row: r.rowNumber,
                field: 'multiple',
                message: r.errorMessage!,
                severity: r.status === 'FAILED' ? 'error' : 'warning'
            }));

        return NextResponse.json({
            success: true,
            uploadId: upload.id,
            status: upload.status,
            currentPhase: upload.currentPhase,
            totalRecords: upload.totalRecords,
            processedRecords: upload.processedRecords,
            successfulRecords: upload.successfulRecords,
            failedRecords: upload.failedRecords,
            skippedRecords: upload.skippedRecords,
            errors: errors.slice(0, 50), // Limit to first 50 errors
            startedAt: upload.startedAt?.toISOString(),
            completedAt: upload.completedAt?.toISOString()
        });
    } catch (error) {
        console.error('Progress fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
