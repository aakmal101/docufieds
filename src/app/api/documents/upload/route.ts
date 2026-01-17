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
    let supabase = createServiceRoleClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/${applicationId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const fileBuffer = await file.arrayBuffer()
    
    let uploadData, uploadError, fileUrl
    
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
      supabase = await createClient()
      const retryResult = await supabase.storage
        .from('documents')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false,
        })
      
      uploadData = retryResult.data
      uploadError = retryResult.error
    }

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to upload file to storage: ${uploadError.message}`,
          error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const urlResult = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    fileUrl = urlResult.data.publicUrl

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, message: 'Failed to generate file URL' },
        { status: 500 }
      )
    }

    // Create document record
    const document = await prisma.document.create({
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

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}



















