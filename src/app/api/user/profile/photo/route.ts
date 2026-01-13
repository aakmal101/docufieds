import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    let publicUrl: string
    
    try {
      const supabase = await createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `profiles/${session.user.id}/profile.${fileExt}`
      const fileBuffer = await file.arrayBuffer()
      
      // Delete old profile photo if exists
      const oldPhoto = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { photoUrl: true },
      })

      if (oldPhoto?.photoUrl && oldPhoto.photoUrl.includes('supabase.co')) {
        // Extract file path from URL if it's a Supabase URL
        try {
          const urlParts = oldPhoto.photoUrl.split('/storage/v1/object/public/documents/')
          if (urlParts.length > 1) {
            const oldPath = urlParts[1]
            await supabase.storage
              .from('documents')
              .remove([oldPath])
          }
        } catch (error) {
          // Ignore errors when deleting old photo
          console.warn('Could not delete old photo:', error)
        }
      }

      // Upload new photo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true, // Replace if exists
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        return NextResponse.json(
          { success: false, message: `Failed to upload file: ${uploadError.message}` },
          { status: 500 }
        )
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl: url } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      
      publicUrl = url
    } catch (error: any) {
      console.error('Supabase client error:', error)
      return NextResponse.json(
        { success: false, message: 'Storage service unavailable. Please check Supabase configuration.' },
        { status: 500 }
      )
    }

    // Update user profile with new photo URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        photoUrl: publicUrl,
      },
      select: {
        id: true,
        photoUrl: true,
        fullName: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl: publicUrl,
        user: updatedUser,
      },
    })
  } catch (error) {
    console.error('Profile photo upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

