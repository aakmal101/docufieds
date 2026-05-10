import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering - this route uses getCurrentUser
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    if (user!.role !== 'ADMIN' && user!.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const country = formData.get('country') as string | null
    const processType = formData.get('processType') as string | null

    if (!file || !documentType) {
      return NextResponse.json(
        { success: false, message: 'File and document type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'File must be a PDF or Word document' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    const supabase = await createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `templates/${documentType}/${Date.now()}.${fileExt}`
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

    // Save raw path instead of public URL
    const internalPath = fileName;

    // Create template record
    const template = await prisma.documentTemplate.create({
      data: {
        documentType,
        country: country || null,
        processType: processType || null,
        fileName: file.name,
        fileUrl: internalPath,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: user!.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Template uploaded successfully',
      data: template,
    })
  } catch (error) {
    console.error('Error uploading template:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')
    const country = searchParams.get('country')
    const processType = searchParams.get('processType')

    // Build query
    const where: any = {}
    if (documentType) {
      where.documentType = documentType
    }
    if (country) {
      where.country = country
    }
    if (processType) {
      where.processType = processType
    }

    // Fetch templates
    const templates = await prisma.documentTemplate.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    const { getSignedDocumentUrl } = await import('@/lib/utils/storage');

    // Generate signed URLs for all templates
    const templatesWithUrls = await Promise.all(templates.map(async (t) => {
      if (t.fileUrl && !t.fileUrl.startsWith('http')) {
        const signedUrl = await getSignedDocumentUrl(t.fileUrl);
        return { ...t, fileUrl: signedUrl || t.fileUrl };
      }
      return t;
    }));

    return NextResponse.json({
      success: true,
      data: templatesWithUrls,
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
