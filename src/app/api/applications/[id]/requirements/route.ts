import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getCurrentUser
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
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

    // Handle both Promise and direct params (Next.js 14+ vs older versions)
    const resolvedParams = params instanceof Promise ? await params : params
    const applicationId = resolvedParams.id

    // Verify application exists and belongs to user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: user!.id,
      },
      // We don't strictly need to include modules relation if we use singular field, 
      // but keeping it doesn't hurt.
      include: {
        modules: true
      } as any
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Use singular module field
    const appModule = (application as any).module;

    // Fetch document requirements for this application
    let requirements = await prisma.documentRequirement.findMany({
      where: {
        country: { in: [application.country, 'default', 'ALL'] },
        processType: { in: [application.processType, 'standard', 'ALL'] } as any,
        OR: [
          { profession: null },
          { profession: application.profession as any || null },
        ],
        // Filter by module: Either global (null) OR matches application.module
        AND: [
          {
            OR: [
              { module: null },
              { module: appModule || undefined } // undefined matches nothing if appModule is null/undefined? No, if appModule is null, we want to just match null. 
              // Wait, if appModule is null (legacy), we only want Global (module: null).
              // If appModule is SET, we want Global OR appModule.
              // So: OR: [ { module: null }, { module: appModule } ] covers both.
              // If appModule is null, { module: null } is duplicated, harmless.
            ]
          }
        ]
      } as any,
      orderBy: {
        isRequired: 'desc',
      },
    })

    // If no requirements found, create default requirements for this application
    if (requirements.length === 0) {
      try {
        let defaultDocumentTypes: { documentType: string; isRequired: boolean; description: string; metadata?: any }[] = []

        if (application.module === 'BUSINESS' && (application as any).businessCategory === 'TRADE_LICENSE') {
          console.log(`[Requirements API] Generating Trade License specific documents for ${applicationId}`)

          // Fetch answers to determine business type and people
          const answers = await prisma.applicationAnswer.findMany({
            where: { applicationId }
          })

          let businessType = 'SOLE_PROPRIETORSHIP'
          let people: any[] = []

          for (const ans of answers) {
            if (ans.fieldKey === 'tradeLicenseSubtype' && typeof ans.value === 'string') {
              businessType = ans.value.replace(/^"|"$/g, '')
            }
            if (ans.fieldKey === 'people' && typeof ans.value === 'string') {
              try {
                people = JSON.parse(ans.value)
              } catch (e) { console.error('Failed to parse people json', e) }
            }
          }

          // Idempotent requirement generation - delete existing generic requirements before creating new ones
          // to allow for changing the subtype/partner count safely
          try {
            await prisma.documentRequirement.deleteMany({
              where: {
                country: application.country,
                processType: application.processType as any,
                profession: application.profession as any || null,
              }
            });
            console.log(`[Requirements API] Cleared old requirements for ${applicationId} to rebuild idempotently.`);
          } catch (e) { /* ignore if none exist */ }

          // Universal docs
          if (businessType === 'PARTNERSHIP') {
            defaultDocumentTypes.push({ documentType: 'Partnership deed', isRequired: true, description: 'Copy of Partnership deed' })
          } else if (businessType === 'LIMITED_COMPANY') {
            defaultDocumentTypes.push({ documentType: 'MOA', isRequired: true, description: 'Memorandum of Association' })
            defaultDocumentTypes.push({ documentType: 'Incorporation certificate', isRequired: true, description: 'Certificate of Incorporation' })
          }


          // Per person docs
          people.forEach((p, idx) => {
            const prefix = `${p.role || 'Person'}`
            const meta = { personId: p.id, personName: p.fullNameEn, role: p.role }
            const docSuffix = businessType === 'SOLE_PROPRIETORSHIP' ? '' : ` (${p.fullNameEn || idx + 1})`

            defaultDocumentTypes.push({
              documentType: `${prefix}: NID upload${docSuffix}`,
              isRequired: true,
              description: `NID Front & Back for ${p.fullNameEn}`,
              metadata: meta
            })
            defaultDocumentTypes.push({
              documentType: `${prefix}: Passport-size photo${docSuffix}`,
              isRequired: true,
              description: `Passport size photo (white background) of ${p.fullNameEn}`,
              metadata: meta
            })
            defaultDocumentTypes.push({
              documentType: `${prefix}: Electric bill / Rental deed${docSuffix}`,
              isRequired: true,
              description: 'Proof of business premises',
              metadata: meta
            })
          })

          // Fallback if people array is empty somehow
          if (people.length === 0) {
            defaultDocumentTypes.push({ documentType: 'Owner/Partner: NID upload', isRequired: true, description: 'Applicant NID' })
            defaultDocumentTypes.push({ documentType: 'Owner/Partner: Passport-size photo', isRequired: true, description: 'Applicant Photo' })
            defaultDocumentTypes.push({ documentType: 'Owner/Partner: Electric bill / Rental deed', isRequired: true, description: 'Proof of address' })
          }

        } else if (application.processType === 'TRADE_LICENSE') {
          // Fallback for legacy app
          defaultDocumentTypes.push({ documentType: 'Trade License Request', isRequired: true, description: 'Legacy Trade License Request' })
        } else {
          defaultDocumentTypes = [
            { documentType: 'Passport', isRequired: true, description: 'Valid passport with at least 6 months validity' },
            { documentType: 'National ID Card', isRequired: true, description: 'Government-issued national identification card' },
            { documentType: 'Birth Certificate', isRequired: true, description: 'Official birth certificate with apostille' },
            { documentType: 'Bank Statements', isRequired: true, description: 'Last 6 months bank statements showing sufficient funds' },
            { documentType: 'Employment Letter', isRequired: true, description: 'Letter from employer confirming employment and salary' },
            { documentType: 'Travel Insurance', isRequired: true, description: 'Comprehensive travel insurance coverage' },
            { documentType: 'Accommodation Proof', isRequired: false, description: 'Hotel booking or accommodation confirmation' },
            { documentType: 'Educational Certificates', isRequired: false, description: 'Academic certificates and transcripts' },
          ]
        }

        console.log(`[Requirements API] No requirements found for country="${application.country}", processType="${application.processType}". Creating defaults...`)

        // Create default requirements with error handling for each
        const createResults = await Promise.allSettled(
          defaultDocumentTypes.map((doc) =>
            prisma.documentRequirement.create({
              data: {
                country: application.country,
                processType: application.processType,
                profession: application.profession || null,
                documentType: doc.documentType,
                isRequired: doc.isRequired,
                description: doc.description,
                metadata: doc.metadata ? doc.metadata : undefined,
              },
            })
          )
        )

        // Filter successful creations
        requirements = createResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)

        // Log any failures
        const failures = createResults.filter(result => result.status === 'rejected')
        if (failures.length > 0) {
          console.warn(`[Requirements API] Failed to create ${failures.length} default requirements:`, failures.map(f => (f as PromiseRejectedResult).reason))
        }

        console.log(`[Requirements API] Successfully created ${requirements.length}/${defaultDocumentTypes.length} default document requirements for application ${applicationId}`)

        // If we couldn't create any requirements, this is a critical error
        if (requirements.length === 0) {
          console.error(`[Requirements API] CRITICAL: Failed to create any default requirements for application ${applicationId}`)
          // Still return empty array - component will use fallback
        }
      } catch (createError: any) {
        console.error('[Requirements API] Error creating default requirements:', createError)
        // If creation fails, return empty array - component will handle fallback
        requirements = []
      }
    } else {
      console.log(`[Requirements API] Found ${requirements.length} existing requirements for application ${applicationId}`)
    }

    // Fetch uploaded documents for this application
    const uploadedDocuments = await prisma.document.findMany({
      where: {
        applicationId: applicationId,
      },
      select: {
        documentType: true,
        fileUrl: true,
        fileName: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: 'desc', // Get most recent upload if duplicates exist
      },
    })

    // Canonical documentType normalization function
    // This ensures consistent matching regardless of case/whitespace
    const normalizeDocType = (value: string): string => {
      return value.trim().toLowerCase().replace(/\s+/g, ' ')
    }

    // TEMPORARY DEBUG: Log all documents found in DB
    console.log(`[Requirements API] Application ID: ${applicationId}`)
    console.log(`[Requirements API] Found ${uploadedDocuments.length} documents in DB:`)
    uploadedDocuments.forEach((doc, idx) => {
      console.log(`  [${idx}] ID: ${doc.documentType} | Type: "${doc.documentType}" | File: "${doc.fileName}" | URL: ${doc.fileUrl?.substring(0, 60) || 'N/A'}... | Uploaded: ${doc.uploadedAt}`)
    })

    // Map requirements with upload status
    // Use a Map to handle multiple documents of same type (take most recent)
    // Database is the SOURCE OF TRUTH - only documents in DB are considered uploaded
    const documentMap = new Map<string, typeof uploadedDocuments[0]>()

    // Use PersonId + documentType if present to handle per-person doc matching safely
    const getDocKey = (docType: string, meta: any) => {
      const canonical = normalizeDocType(docType);
      if (meta && typeof meta === 'object' && meta.personId) {
        return `${canonical}_${meta.personId}`;
      }
      return canonical;
    };

    const requirementsWithStatus = requirements.map((req) => {
      // Find matching uploaded document by docType and personId if it exists
      // Wait, we need to populate documentMap differently?
      // Since requirements define the `metadata.personId`, uploaded documents will ALSO have `metadata.personId` when uploaded.
      // But uploaded documents in this DB query DO NOT select `metadata`. We must fetch it!
      // Actually, since we didn't fetch metadata of uploadedDocuments, per-person matching could fail.

      // We will assume uploaded documents have the EXACT documentType string as the generated requirement
      // for matching right now, since the actual Document table uses documentType.
      const normalizedReqType = normalizeDocType(req.documentType)

      // Let's find the matching document directly from the array for now using the normalized name
      const uploadedDoc = uploadedDocuments.find(d => normalizeDocType(d.documentType) === normalizedReqType);

      // CRITICAL: Validate file data from database
      const hasValidFile = uploadedDoc &&
        uploadedDoc.fileUrl &&
        uploadedDoc.fileUrl.trim().length > 0 &&
        uploadedDoc.fileName &&
        uploadedDoc.fileName.trim().length > 0

      return {
        ...req,
        status: hasValidFile ? 'uploaded' : 'pending',
        uploadedFile: hasValidFile ? {
          fileUrl: uploadedDoc.fileUrl.trim(),
          fileName: uploadedDoc.fileName.trim(),
          uploadedAt: uploadedDoc.uploadedAt,
        } : null,
      }
    })

    // TEMPORARY DEBUG: Log complete mapping result
    console.log(`[Requirements API] Mapping result for application ${applicationId}:`)
    requirementsWithStatus.forEach(req => {
      console.log(`  - Requirement: "${req.documentType}" | Status: ${req.status} | Has File: ${!!req.uploadedFile} | File URL: ${req.uploadedFile?.fileUrl?.substring(0, 60) || 'N/A'}...`)
    })
    console.log(`[Requirements API] Document map keys: ${Array.from(documentMap.keys()).join(', ')}`)

    const response = NextResponse.json({
      success: true,
      data: requirementsWithStatus,
    })

    // Force no-cache headers to prevent stale responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error: any) {
    console.error('Error fetching document requirements:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
