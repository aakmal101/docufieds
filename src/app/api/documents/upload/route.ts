import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/${applicationId}/${Date.now()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { success: false, message: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    const fileUrl = publicUrl

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



















