import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const uploads = await prisma.bulkUpload.findMany({
            where: { userId: session.user.id },
            orderBy: { uploadedAt: 'desc' },
            take: 20,
            select: {
                id: true,
                fileName: true,
                status: true,
                totalRecords: true,
                successfulRecords: true,
                failedRecords: true,
                skippedRecords: true,
                uploadedAt: true,
                completedAt: true,
                currentPhase: true
            }
        });

        return NextResponse.json({
            success: true,
            uploads: uploads.map(upload => ({
                ...upload,
                uploadedAt: upload.uploadedAt.toISOString(),
                completedAt: upload.completedAt?.toISOString()
            }))
        });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
