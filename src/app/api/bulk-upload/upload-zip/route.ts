import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processZipUpload } from '@/lib/zip-processor';

export const dynamic = 'force-dynamic';
// Increase timeout for ZIP processing (important for self-hosted/larger files)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 1. Check permissions
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (!user || user.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bulkUploadId = formData.get('bulkUploadId') as string;

        if (!file || !bulkUploadId) {
            return NextResponse.json(
                { success: false, error: 'File and bulkUploadId are required' },
                { status: 400 }
            );
        }

        if (!file.name.endsWith('.zip')) {
            return NextResponse.json(
                { success: false, error: 'Only .zip files are allowed' },
                { status: 400 }
            );
        }

        // 2. Validate bulk upload existence and ownership
        const bulkUpload = await prisma.bulkUpload.findUnique({
            where: { id: bulkUploadId },
        });

        if (!bulkUpload || bulkUpload.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Bulk upload not found or access denied' },
                { status: 404 }
            );
        }

        // 3. Process the ZIP file
        // We pass the buffer directly to our processor util
        const arrayBuffer = await file.arrayBuffer();

        // Update status to indicate zip processing
        await prisma.bulkUpload.update({
            where: { id: bulkUploadId },
            data: {
                currentPhase: 'Processing ZIP documents...',
                // We don't change 'status' to PROCESSING if it was already COMPLETED, 
                // but for UI feedback we might want to update currentPhase.
            }
        });

        const result = await processZipUpload(
            arrayBuffer,
            bulkUploadId,
            session.user.id
        );

        // 4. Return results
        return NextResponse.json({
            success: true,
            message: 'ZIP processed successfully',
            data: result
        });

    } catch (error) {
        // eslint-disable-next-line
        console.error('ZIP upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error processing ZIP' },
            { status: 500 }
        );
    }
}
