import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth-service';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { parseUploadedFile } from '@/lib/bulk-upload-parser';
import { validateBulkUploadRow, validateBulkUploadFile } from '@/lib/bulk-upload-validator';
import { BulkUploadRow } from '@/types/bulk-upload';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for processing

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Check if user is an agency (only agencies can bulk upload)

        if (!user || user.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Only agencies can use bulk upload feature' },
                { status: 403 }
            );
        }

        if (user.status !== 'APPROVED') {
            return NextResponse.json(
                { success: false, error: 'Your agency account must be approved first' },
                { status: 403 }
            );
        }

        // 3. Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // 4. Validate file
        const fileValidation = validateBulkUploadFile(file);
        if (!fileValidation.valid) {
            return NextResponse.json(
                { success: false, error: fileValidation.error },
                { status: 400 }
            );
        }

        // 5. Upload file to Supabase Storage
        const supabase = await createClient();
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}_${file.name}`;

        const fileBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`bulk-uploads/${fileName}`, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('File upload error:', uploadError);
            return NextResponse.json(
                { success: false, error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        const internalPath = `bulk-uploads/${fileName}`;

        // 6. Parse file
        let parsedData: any[];
        try {
            parsedData = await parseUploadedFile(file);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}` },
                { status: 400 }
            );
        }

        if (parsedData.length === 0) {
            return NextResponse.json(
                { success: false, error: 'File contains no data rows' },
                { status: 400 }
            );
        }

        if (parsedData.length > 100) {
            return NextResponse.json(
                { success: false, error: 'File contains more than 100 records. Please split into smaller batches.' },
                { status: 400 }
            );
        }

        // 7. Create bulk upload record
        const bulkUpload = await prisma.bulkUpload.create({
            data: {
                userId: user.id,
                fileName: file.name,
                fileUrl: internalPath,
                fileSize: file.size,
                totalRecords: parsedData.length,
                status: 'VALIDATING',
                currentPhase: 'Validating data...',
                startedAt: new Date()
            }
        });

        // 8. Trigger background processing (we'll do it synchronously for now, can be moved to queue)
        processUploadInBackground(bulkUpload.id, parsedData);

        return NextResponse.json({
            success: true,
            uploadId: bulkUpload.id,
            totalRecords: parsedData.length,
            message: 'Upload started successfully'
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Background processing function
async function processUploadInBackground(uploadId: string, data: any[]) {
    try {
        // Get available countries
        const countries = await prisma.country.findMany({
            select: { name: true, code: true }
        });
        const countryNames = countries.map((c: { name: string }) => c.name);

        // Validate all rows first
        const validationResults = data.map((row, index) => ({
            rowNumber: index + 2, // +2 because Excel rows start at 1 and we have header
            ...validateBulkUploadRow(row, index + 2, countryNames)
        }));

        const validRows = validationResults.filter(r => r.valid);
        const invalidRows = validationResults.filter(r => !r.valid);

        // Update status to processing
        await prisma.bulkUpload.update({
            where: { id: uploadId },
            data: {
                status: 'PROCESSING',
                currentPhase: 'Creating applications...',
                skippedRecords: invalidRows.length
            }
        });

        // Process valid rows
        let successCount = 0;
        let failCount = 0;

        for (const validatedRow of validRows) {
            try {
                await processIndividualRecord(uploadId, validatedRow.rowNumber, validatedRow.data!);
                successCount++;

                // Update progress
                await prisma.bulkUpload.update({
                    where: { id: uploadId },
                    data: {
                        processedRecords: successCount + failCount,
                        successfulRecords: successCount,
                        failedRecords: failCount
                    }
                });
            } catch (error) {
                failCount++;
                console.error(`Failed to process row ${validatedRow.rowNumber}:`, error);

                // Create failed record
                await prisma.bulkUploadRecord.create({
                    data: {
                        bulkUploadId: uploadId,
                        rowNumber: validatedRow.rowNumber,
                        originalData: validatedRow.data as any,
                        status: 'FAILED',
                        errorMessage: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        }

        // Create skipped records for invalid rows
        for (const invalidRow of invalidRows) {
            await prisma.bulkUploadRecord.create({
                data: {
                    bulkUploadId: uploadId,
                    rowNumber: invalidRow.rowNumber,
                    originalData: data[invalidRow.rowNumber - 2],
                    status: 'SKIPPED',
                    errorMessage: invalidRow.errors.map(e => `${e.field}: ${e.message}`).join('; ')
                }
            });
        }

        // Final update
        await prisma.bulkUpload.update({
            where: { id: uploadId },
            data: {
                status: 'COMPLETED',
                currentPhase: 'Processing completed',
                completedAt: new Date(),
                processedRecords: validRows.length,
                successfulRecords: successCount,
                failedRecords: failCount,
                errorSummary: {
                    totalErrors: invalidRows.length + failCount,
                    validationErrors: invalidRows.length,
                    processingErrors: failCount
                }
            }
        });
    } catch (error) {
        console.error('Background processing error:', error);
        await prisma.bulkUpload.update({
            where: { id: uploadId },
            data: {
                status: 'FAILED',
                currentPhase: 'Processing failed',
                completedAt: new Date(),
                errorSummary: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            }
        });
    }
}

async function processIndividualRecord(uploadId: string, rowNumber: number, rowData: BulkUploadRow) {
    // Find or create user
    let userId: string;
    let isNewUser = false;
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: rowData.email || undefined },
                { individualProfile: { phoneNumber: rowData.phone || undefined } }
            ]
        }
    });

    if (existingUser) {
        userId = existingUser.id;
    } else {
        const names = rowData.full_name ? rowData.full_name.split(' ') : ['']
        const firstName = names[0]
        const lastName = names.slice(1).join(' ') || ''

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email: rowData.email,
                dateOfBirth: rowData.date_of_birth ? new Date(rowData.date_of_birth) : undefined,
                placeOfBirth: rowData.place_of_birth,
                nationality: rowData.nationality,
                passportExpiry: rowData.passport_expiry ? new Date(rowData.passport_expiry) : undefined,
                gender: rowData.gender,
                maritalStatus: rowData.marital_status,
                presentAddress: rowData.address,
                role: 'INDIVIDUAL',
                status: 'APPROVED', // Auto-approve for bulk upload
                isVerified: true,
                individualProfile: {
                    create: {
                        firstName: firstName,
                        lastName: lastName,
                        phoneNumber: rowData.phone,
                        passportNumber: rowData.passport_number,
                    }
                }
            }
        });
        userId = newUser.id;
        isNewUser = true;
    }

    // Find country
    const country = await prisma.country.findFirst({
        where: {
            OR: [
                { name: { contains: rowData.destination_country, mode: 'insensitive' } },
                { code: rowData.destination_country.toUpperCase() }
            ]
        }
    });

    if (!country) {
        throw new Error(`Country not found: ${rowData.destination_country}`);
    }

    // Calculate consultancy fee (simplified - you may have complex logic)
    const consultancyFee = 5000; // Default fee

    // Create application
    const application = await prisma.application.create({
        data: {
            userId: userId,
            country: country.name,
            processType: rowData.visa_category as any,
            profession: rowData.profession as any,
            consultancyFee: consultancyFee,
            status: 'DRAFT',
            bulkUploadId: uploadId
        }
    });

    // Create bulk upload record
    await prisma.bulkUploadRecord.create({
        data: {
            bulkUploadId: uploadId,
            rowNumber: rowNumber,
            originalData: rowData as any,
            status: 'SUCCESS',
            applicationId: application.id,
            createdUserId: isNewUser ? userId : undefined,
            existingUserId: !isNewUser ? userId : undefined,
            processedAt: new Date()
        }
    });

    // Note: Document mapping would be handled separately when actual document files are uploaded
    // For now, we just create the applications with references to document filenames in special_instructions
    return { userId, applicationId: application.id };
}
