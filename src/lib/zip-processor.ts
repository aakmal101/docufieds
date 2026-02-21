import JSZip from 'jszip';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { Application } from '@prisma/client';

export type ZipProcessingResult = {
  totalFilesFound: number;
  matchedDocuments: number;
  existingSkipped: number;
  uploadFailures: number;
  missingFiles: string[];
};

export async function processZipUpload(
  fileBuffer: ArrayBuffer,
  bulkUploadId: string,
  userId: string
): Promise<ZipProcessingResult> {
  const supabase = await createClient();
  const zip = new JSZip();
  await zip.loadAsync(fileBuffer);

  const result: ZipProcessingResult = {
    totalFilesFound: 0,
    matchedDocuments: 0,
    existingSkipped: 0,
    uploadFailures: 0,
    missingFiles: []
  };

  // 1. Fetch all applications for this bulk upload
  const applications = await prisma.application.findMany({
    where: {
      bulkUploadId,
      userId
    },
    include: {
      bulkUploadRecord: true
    }
  });

  // 2. Build map: { normalized_filename -> [ { app, docType } ] }
  const filenameMap = new Map<string, { app: Application; docType: string }[]>();
  const docTypes = ['passport', 'photo', 'national_id', 'birth_certificate', 'police_clearance', 'bank_statement'];

  for (const app of applications) {
    if (!app.bulkUploadRecord?.originalData) continue;

    // Type checking for JSON data
    const data = app.bulkUploadRecord.originalData;
    if (typeof data !== 'object' || data === null) continue;
    const recordData = data as Record<string, unknown>;

    for (const type of docTypes) {
      const val = recordData[type];
      if (typeof val === 'string' && val.trim() !== '') {
        const normalizedName = val.trim().toLowerCase();

        if (!filenameMap.has(normalizedName)) {
          filenameMap.set(normalizedName, []);
        }
        filenameMap.get(normalizedName)!.push({ app, docType: type });
      }
    }
  }

  // 3. Iterate through files in ZIP
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;

    const cleanFileName = zipEntry.name.split('/').pop() || zipEntry.name;
    const normalizedZipName = cleanFileName.toLowerCase();

    result.totalFilesFound++;

    const matches = filenameMap.get(normalizedZipName);

    if (matches && matches.length > 0) {
      for (const match of matches) {
        filePromises.push(
          (async () => {
            try {
              // A. Check idempotency (Database check)
              const existingDoc = await prisma.document.findFirst({
                where: {
                  applicationId: match.app.id,
                  documentType: match.docType
                }
              });

              if (existingDoc) {
                result.existingSkipped++;
                return;
              }

              // B. Deterministic Storage Path
              // {applicationId}/{docType}/{cleanFileName}
              // Normalizing filename in storage path prevents duplicates if cases differ slightly
              const storagePath = `${match.app.id}/${match.docType}/${cleanFileName}`;

              const content = await zipEntry.async('arraybuffer');

              // C. Upload to Supabase
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(storagePath, content, {
                  contentType: 'application/octet-stream', // Auto-detection best effort
                  upsert: true
                });

              if (uploadError) throw new Error(uploadError.message);

              // Get public URL
              const supabaseLocal2 = await createClient();
              const { data: publicUrlData } = supabaseLocal2.storage
                .from('documents')
                .getPublicUrl(storagePath);
              const publicUrl = publicUrlData.publicUrl;

              // D. Create Document Record
              await prisma.document.create({
                data: {
                  applicationId: match.app.id,
                  userId: userId,
                  fileName: cleanFileName,
                  fileUrl: publicUrl,
                  fileType: cleanFileName.split('.').pop() || 'unknown', // Simple extension extraction
                  fileSize: content.byteLength,
                  documentType: match.docType,
                  isRequired: true
                }
              });

              result.matchedDocuments++;

            } catch (err) {
              console.error(`Failed to process ${cleanFileName} for app ${match.app.id}:`, err);
              result.uploadFailures++;
            }
          })()
        );
      }
    }
  });

  // Execute processing with concurrency limit
  // Although we are self-hosted, limiting concurrency prevents DB pool exhaustion
  const CONCURRENCY = 10;
  for (let i = 0; i < filePromises.length; i += CONCURRENCY) {
    await Promise.all(filePromises.slice(i, i + CONCURRENCY));
  }

  return result;
}
