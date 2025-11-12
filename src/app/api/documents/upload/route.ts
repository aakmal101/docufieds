import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // In a real application, you would upload the file to cloud storage
    // For now, we'll simulate the upload and store metadata
    const fileUrl = `/uploads/${Date.now()}-${file.name}`

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














