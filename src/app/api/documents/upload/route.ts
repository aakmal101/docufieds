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
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Upload file to Supabase Storage
    // Try service role client first for better reliability, fallback to regular client
    let supabase
    let uploadData, uploadError, fileUrl
    
    try {
      supabase = createServiceRoleClient()
    } catch (serviceRoleError: any) {
      console.warn('Service role client creation failed, using regular client:', serviceRoleError.message)
      supabase = await createClient()
    }
    
    const fileExt = file.name.split('.').pop()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${session.user.id}/${applicationId}/${Date.now()}-${sanitizedFileName}`
    const fileBuffer = await file.arrayBuffer()
    
    console.log(`[Upload API] Attempting upload: bucket=documents, fileName=${fileName}, size=${file.size}, type=${file.type}`)
    
    // Try upload with service role client
    const uploadResult = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })
    
    uploadData = uploadResult.data
    uploadError = uploadResult.error

    // If service role client fails, try regular client
    if (uploadError) {
      console.warn('Service role upload failed, trying regular client:', uploadError.message)
      try {
        supabase = await createClient()
        const retryResult = await supabase.storage
          .from('documents')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          })
        
        uploadData = retryResult.data
        uploadError = retryResult.error
      } catch (retryError: any) {
        console.error('Regular client upload also failed:', retryError)
        uploadError = retryError
      }
    }

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to upload file to storage: ${uploadError.message || 'Unknown error'}`,
          error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        },
        { status: 500 }
      )
    }
    
    console.log(`[Upload API] Upload successful: path=${uploadData?.path}`)

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
      await prisma.statusUpdate.create({
        data: {
          applicationId,
          status: 'DOCUMENT_UNDER_PROCESSING',
          message: `Document uploaded: ${documentType}`,
          updatedBy: session.user.id,
        },
      })
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



















