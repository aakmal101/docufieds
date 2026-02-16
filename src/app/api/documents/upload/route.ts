import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// Force dynamic rendering - this route uses getServerSession and cookies() via Supabase
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const applicationId = formData.get('applicationId') as string
    const documentType = formData.get('documentType') as string

    if (!file || !applicationId || !documentType) {
      return NextResponse.json(
        { success: false, message: 'File, application ID, and document type are required' },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        userId: true,
        country: true,
        processType: true,
        profession: true,
      }
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Upload file to Supabase Storage
    // Bucket exists and is public (verified: name='documents', public=true, 22 files already uploaded)
    // Try service role client first for better reliability, fallback to regular client
    let supabase
    let uploadData, uploadError, fileUrl
    let clientType = 'unknown'

    try {
      // Try service role client first (if SUPABASE_SERVICE_ROLE_KEY is set)
      supabase = createServiceRoleClient()
      clientType = 'service_role'
      console.log('[Upload API] ✓ Using service role client')
    } catch (serviceRoleError: any) {
      // Service role key not set or invalid - fallback to regular client
      // This is OK - bucket is public and has public upload policies
      console.log('[Upload API] Service role not available, using regular client (this is OK for public bucket)')
      try {
        supabase = await createClient()
        clientType = 'regular'
        console.log('[Upload API] ✓ Using regular client')
      } catch (clientError: any) {
        console.error('[Upload API] CRITICAL: Failed to create any Supabase client:', clientError)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to initialize storage client. Please check your configuration.',
            error: process.env.NODE_ENV === 'development' ? clientError.message : undefined
          },
          { status: 500 }
        )
      }
    }

    // Verify we have a valid client
    if (!supabase) {
      console.error('[Upload API] CRITICAL: No Supabase client available')
      return NextResponse.json(
        {
          success: false,
          message: 'Storage client not available. Please contact support.',
        },
        { status: 500 }
      )
    }

    const fileExt = file.name.split('.').pop()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${session.user.id}/${applicationId}/${Date.now()}-${sanitizedFileName}`
    const fileBuffer = await file.arrayBuffer()

    console.log(`[Upload API] Attempting upload: bucket=documents, fileName=${fileName}, size=${file.size}, type=${file.type}, client=${clientType}`)

    // REMOVED: Bucket check - it was causing false errors
    // Bucket exists and is public (verified via database query: name='documents', public=true)
    // Direct upload attempt will provide clear error if bucket doesn't exist

    // Try upload with current client
    console.log(`[Upload API] Uploading with ${clientType} client...`)
    const uploadResult = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    uploadData = uploadResult.data
    uploadError = uploadResult.error

    // If service role client fails, try regular client as fallback
    if (uploadError && clientType === 'service_role') {
      console.warn(`[Upload API] Service role upload failed (${uploadError.message}), trying regular client as fallback...`)
      try {
        const fallbackClient = await createClient()
        const retryResult = await fallbackClient.storage
          .from('documents')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          })

        uploadData = retryResult.data
        uploadError = retryResult.error

        if (!uploadError) {
          console.log('[Upload API] ✓ Regular client upload succeeded after service role failed')
          supabase = fallbackClient // Use fallback client for URL generation
        } else {
          console.error('[Upload API] Regular client upload also failed:', uploadError)
        }
      } catch (retryError: any) {
        console.error('[Upload API] Regular client creation/upload failed:', retryError)
        // Keep original error if retry fails
        if (!uploadError) {
          uploadError = retryError
        }
      }
    }

    if (uploadError) {
      console.error('[Upload API] Supabase upload error:', uploadError)
      const errorMessage = uploadError.message || uploadError.toString() || 'Unknown storage error'
      const errorCode = (uploadError as any)?.statusCode || (uploadError as any)?.code || 'UNKNOWN'

      console.error(`[Upload API] Error details: message="${errorMessage}", code="${errorCode}"`)

      // Provide user-friendly error messages based on actual error
      let userMessage = 'Failed to upload file to storage'

      // Check for specific error patterns
      // Only show bucket error if it's explicitly a bucket not found error
      const isBucketNotFound = errorMessage.includes('Bucket not found') ||
        (errorCode === '404' && errorMessage.toLowerCase().includes('bucket'))

      if (isBucketNotFound) {
        console.error('[Upload API] CRITICAL: Bucket not found error detected')
        console.error('[Upload API] Full error object:', JSON.stringify(uploadError, null, 2))
        userMessage = 'Storage bucket not configured. Please contact support.'
      } else if (errorMessage.includes('The resource already exists') ||
        errorMessage.includes('already exists') ||
        errorCode === '409') {
        userMessage = 'A file with this name already exists. Please rename your file and try again.'
      } else if (errorMessage.includes('new row violates row-level security') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') ||
        errorCode === '403' ||
        errorCode === '401') {
        userMessage = 'Permission denied. Please ensure you have access to upload documents.'
      } else if (errorMessage.includes('JWT') ||
        errorMessage.includes('token') ||
        errorMessage.includes('authentication')) {
        userMessage = 'Authentication error. Please refresh the page and try again.'
      } else if (errorMessage.includes('size') ||
        errorMessage.includes('too large')) {
        userMessage = 'File is too large. Maximum file size is 10MB.'
      } else {
        // Generic error - provide the actual error message to help debug
        userMessage = `Upload failed: ${errorMessage.substring(0, 100)}`
      }

      return NextResponse.json(
        {
          success: false,
          message: userMessage,
          error: process.env.NODE_ENV === 'development' ? {
            message: errorMessage,
            code: errorCode,
            fullError: uploadError
          } : undefined
        },
        { status: 500 }
      )
    }

    if (!uploadData || !uploadData.path) {
      console.error('[Upload API] Upload succeeded but no data returned:', uploadData)
      return NextResponse.json(
        {
          success: false,
          message: 'Upload completed but file path not returned. Please try again.',
        },
        { status: 500 }
      )
    }

    console.log(`[Upload API] Upload successful: path=${uploadData.path}`)

    // Get public URL for the uploaded file
    const urlResult = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path || fileName)

    fileUrl = urlResult.data.publicUrl

    if (!fileUrl) {
      console.error('[Upload API] Failed to generate file URL. uploadData:', uploadData)
      return NextResponse.json(
        { success: false, message: 'Failed to generate file URL' },
        { status: 500 }
      )
    }

    console.log(`[Upload API] Generated file URL: ${fileUrl.substring(0, 100)}...`)

    // Check if a document of this type already exists for this application
    // If it does, we'll update it instead of creating a new one
    const existingDocument = await prisma.document.findFirst({
      where: {
        applicationId,
        documentType,
      },
    })

    let document
    if (existingDocument) {
      // Update existing document (replace the old one)
      document = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          fileName: file.name,
          fileUrl,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date(),
        },
      })
    } else {
      // Create new document record
      document = await prisma.document.create({
        data: {
          applicationId,
          userId: session.user.id,
          fileName: file.name,
          fileUrl,
          fileType: file.type,
          fileSize: file.size,
          documentType,
          isRequired: true,
        },
      })
    }

    // Verify the document was saved correctly
    if (!document || !document.fileUrl || !document.fileName) {
      console.error('Document save verification failed:', { document })
      return NextResponse.json(
        { success: false, message: 'Failed to save document record' },
        { status: 500 }
      )
    }

    // DEBUG: Log the saved document to verify documentType
    console.log(`[Upload API] Document saved: type="${document.documentType}", file="${document.fileName}", applicationId="${applicationId}"`)

    // Update application status if this is the first document
    if (application.status === 'DOCUMENT_UNDER_REVIEW') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'DOCUMENT_UNDER_PROCESSING' },
      })

      // Create status update
      await (prisma as any).applicationStatusUpdate.create({
        data: {
          applicationId,
          status: 'DOCUMENT_UNDER_PROCESSING',
          message: `Document uploaded: ${documentType}`,
          updatedBy: session.user.id,
        },
      })
    }

    // Update Module Status Logic
    try {
      // 1. Check if this document is part of a module requirement
      const requirement = await prisma.documentRequirement.findFirst({
        where: {
          country: application.country,
          processType: application.processType as any,
          documentType: documentType,
          module: { not: null }
        } as any
      })

      if (requirement && (requirement as any).module) {
        const moduleType = (requirement as any).module

        // 2. Fetch all requirements for this module
        const moduleRequirements = await prisma.documentRequirement.findMany({
          where: {
            country: application.country,
            processType: application.processType as any,
            OR: [
              { profession: null },
              { profession: (application as any).profession || null }
            ],
            module: moduleType,
            isRequired: true
          } as any
        })

        // 3. Fetch all uploaded documents for this module's requirements
        const uploadedModuleDocs = await prisma.document.findMany({
          where: {
            applicationId,
            documentType: { in: moduleRequirements.map(r => r.documentType) }
          },
          select: { documentType: true }
        })

        // 4. Check if all requirements are met
        const uploadedTypes = new Set(uploadedModuleDocs.map(d => d.documentType))
        const allMet = moduleRequirements.every(req => uploadedTypes.has(req.documentType))
        const newStatus = allMet ? 'COMPLETE' : 'IN_PROGRESS'

        // 5. Update ApplicationModule status
        // We use updateMany here because we can't easily use upsert with composite unique key 
        // without exact type matching in client-side code sometimes
        const moduleRecord = await (prisma as any).applicationModule.findFirst({
          where: { applicationId, module: moduleType }
        })

        if (moduleRecord) {
          await (prisma as any).applicationModule.update({
            where: { id: moduleRecord.id },
            data: {
              status: newStatus,
              completedAt: allMet ? new Date() : null,
              updatedAt: new Date()
            }
          })
          console.log(`[Upload API] Updated module ${moduleType} status to ${newStatus}`)
        }
      }
    } catch (moduleUpdateError) {
      console.error('[Upload API] Failed to update module status:', moduleUpdateError)
      // Don't fail the upload if module status update fails
      // Just log it
    }

    // Return the document in the exact format the frontend expects
    // This is the SOURCE OF TRUTH - the database record
    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.id,
        applicationId: document.applicationId,
        documentType: document.documentType,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        // Also include in the format expected by requirements API
        uploadedFile: {
          fileUrl: document.fileUrl,
          fileName: document.fileName,
          uploadedAt: document.uploadedAt,
        },
      },
    })
  } catch (error: any) {
    console.error('Document upload error:', error)
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



















