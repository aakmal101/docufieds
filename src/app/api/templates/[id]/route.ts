import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering - this route uses getCurrentUser
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete file from Supabase Storage
    try {
      const supabase = await createClient()
      // Extract file path from URL
      const urlParts = template.fileUrl.split('/storage/v1/object/public/documents/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
          .from('documents')
          .remove([filePath])
      }
    } catch (error) {
      console.warn('Could not delete file from storage:', error)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete template record
    await prisma.documentTemplate.delete({
      where: { id: templateId },
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
