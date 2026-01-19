import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession
export const dynamic = 'force-dynamic'

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
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Fetch document requirements for this application
    let requirements = await prisma.documentRequirement.findMany({
      where: {
          country: application.country,
          processType: application.processType,
          OR: [
            { profession: null },
            { profession: application.profession || null },
          ],
        },
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

        // Create default requirements
        const createPromises = defaultDocumentTypes.map((doc) =>
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

        requirements = await Promise.all(createPromises)
        console.log(`Created ${requirements.length} default document requirements for application ${applicationId}`)
      } catch (createError: any) {
        console.error('Error creating default requirements:', createError)
        // If creation fails, return empty array - component will handle fallback
        requirements = []
      }
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

    // Map requirements with upload status
    // Use a Map to handle multiple documents of same type (take most recent)
    // Database is the SOURCE OF TRUTH - only documents in DB are considered uploaded
    const documentMap = new Map<string, typeof uploadedDocuments[0]>()
    
    // DEBUG: Log all uploaded documents to verify they're being fetched
    console.log(`[Requirements API] Found ${uploadedDocuments.length} uploaded documents for application ${applicationId}`)
    uploadedDocuments.forEach((doc) => {
      console.log(`[Requirements API] Document: type="${doc.documentType}", file="${doc.fileName}", url="${doc.fileUrl?.substring(0, 50)}..."`)
    })
    
    uploadedDocuments.forEach((doc) => {
      // Only include documents with valid file data
      if (doc.fileUrl && doc.fileUrl.trim().length > 0 && 
          doc.fileName && doc.fileName.trim().length > 0) {
        // CRITICAL: Use exact documentType match (case-sensitive, trimmed)
        const docType = doc.documentType.trim()
        if (!documentMap.has(docType) || 
            (doc.uploadedAt && documentMap.get(docType)?.uploadedAt && 
             doc.uploadedAt > documentMap.get(docType)!.uploadedAt)) {
          documentMap.set(docType, doc)
        }
      }
    })

    const requirementsWithStatus = requirements.map((req) => {
      // CRITICAL: Match documentType exactly (case-sensitive, trimmed)
      const reqDocType = req.documentType.trim()
      const uploadedDoc = documentMap.get(reqDocType)
      
      // DEBUG: Log matching attempt
      if (uploadedDoc) {
        console.log(`[Requirements API] Matched requirement "${reqDocType}" with uploaded document`)
      } else {
        console.log(`[Requirements API] No match for requirement "${reqDocType}" (available types: ${Array.from(documentMap.keys()).join(', ')})`)
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

    return NextResponse.json({
      success: true,
      data: requirementsWithStatus,
    })
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
