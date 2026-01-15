import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses getServerSession
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templateId = params.id

    // Fetch template
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    // Fetch the file from Supabase Storage
    try {
      const response = await fetch(template.fileUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch template file')
      }

      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()

      // Return file as download
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': template.fileType,
          'Content-Disposition': `attachment; filename="${template.fileName}"`,
          'Content-Length': template.fileSize.toString(),
        },
      })
    } catch (error) {
      console.error('Error downloading template:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to download template' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in template download:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
