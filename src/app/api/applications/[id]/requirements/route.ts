import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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
        userId: session.user.id,
      },
      include: {
        modules: true
      } as any // Cast to any to allow modules property
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Get active module types
    const activeModules = (application as any).modules?.map((m: any) => m.module) || []

    // Fetch document requirements for this application
    let requirements = await prisma.documentRequirement.findMany({
      where: {
        country: application.country,
        processType: application.processType as any,
        OR: [
          { profession: null },
          { profession: application.profession as any || null },
        ],
        // Filter by active modules or global requirements
        AND: [
          {
            OR: [
              { module: null },
              { module: { in: activeModules } }
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
        const defaultDocumentTypes = [
          { documentType: 'Passport', isRequired: true, description: 'Valid passport with at least 6 months validity' },
          { documentType: 'National ID Card', isRequired: true, description: 'Government-issued national identification card' },
          { documentType: 'Birth Certificate', isRequired: true, description: 'Official birth certificate with apostille' },
          { documentType: 'Bank Statements', isRequired: true, description: 'Last 6 months bank statements showing sufficient funds' },
          { documentType: 'Employment Letter', isRequired: true, description: 'Letter from employer confirming employment and salary' },
          { documentType: 'Travel Insurance', isRequired: true, description: 'Comprehensive travel insurance coverage' },
          { documentType: 'Accommodation Proof', isRequired: false, description: 'Hotel booking or accommodation confirmation' },
          { documentType: 'Educational Certificates', isRequired: false, description: 'Academic certificates and transcripts' },
        ]

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

    uploadedDocuments.forEach((doc) => {
      // Only include documents with valid file data
      if (doc.fileUrl && doc.fileUrl.trim().length > 0 &&
        doc.fileName && doc.fileName.trim().length > 0) {
        // CRITICAL: Use canonical normalization for matching
        const normalizedType = normalizeDocType(doc.documentType)
        if (!documentMap.has(normalizedType) ||
          (doc.uploadedAt && documentMap.get(normalizedType)?.uploadedAt &&
            doc.uploadedAt > documentMap.get(normalizedType)!.uploadedAt)) {
          documentMap.set(normalizedType, doc)
        }
      }
    })

    const requirementsWithStatus = requirements.map((req) => {
      // CRITICAL: Use canonical normalization for matching
      const normalizedReqType = normalizeDocType(req.documentType)
      const uploadedDoc = documentMap.get(normalizedReqType)

      // TEMPORARY DEBUG: Log matching attempt
      if (uploadedDoc) {
        console.log(`[Requirements API] ✓ Matched requirement "${req.documentType}" (normalized: "${normalizedReqType}") with uploaded document`)
      } else {
        console.log(`[Requirements API] ✗ No match for requirement "${req.documentType}" (normalized: "${normalizedReqType}") | Available normalized types: ${Array.from(documentMap.keys()).join(', ')}`)
      }

      // CRITICAL: Validate file data from database
      // A document is only considered uploaded if it exists in DB with valid data
      const hasValidFile = uploadedDoc &&
        uploadedDoc.fileUrl &&
        uploadedDoc.fileUrl.trim().length > 0 &&
        uploadedDoc.fileName &&
        uploadedDoc.fileName.trim().length > 0

      return {
        ...req,
        // Status is determined by database record existence
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
