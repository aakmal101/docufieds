import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generateTemplateWorkbook } from '@/lib/bulk-upload-parser';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const workbook = generateTemplateWorkbook();

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="docufieds_bulk_upload_template.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generating template:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate template' },
            { status: 500 }
        );
    }
}
