import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering - this route uses getCurrentUser and cookies() via Supabase
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

    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    // Create Supabase client
    let supabase
    try {
      supabase = await createClient()
    } catch (error: any) {
      console.error('Failed to create Supabase client:', error)
      return NextResponse.json(
        {
          success: false,
          message: `Storage service unavailable: ${error.message || 'Failed to initialize storage service'}`,
        },
        { status: 500 }
      )
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `profiles/${user!.id}/profile.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    // Delete old profile photo if exists
    try {
      const oldPhoto = await prisma.user.findUnique({
        where: { id: user!.id },
        select: { photoUrl: true },
      })

      if (oldPhoto?.photoUrl && oldPhoto.photoUrl.includes('supabase.co')) {
        // Extract file path from URL if it's a Supabase URL
        try {
          const urlParts = oldPhoto.photoUrl.split('/storage/v1/object/public/avatars/')
          if (urlParts.length > 1) {
            const oldPath = urlParts[1]
            await supabase.storage
              .from('avatars')
              .remove([oldPath])
          }
        } catch (error) {
          // Ignore errors when deleting old photo
          console.warn('Could not delete old photo:', error)
        }
      }
    } catch (error) {
      // Ignore errors when fetching old photo
      console.warn('Could not fetch old photo:', error)
    }

    // Upload new photo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to upload file: ${uploadError.message}`,
          details: process.env.NODE_ENV === 'development' ? uploadError : undefined
        },
        { status: 500 }
      )
    }

    // Save raw path instead of public URL
    const internalPath = fileName;

    // Update user profile with new photo URL
    const updatedUser = await prisma.user.update({
      where: { id: user!.id },
      data: {
        photoUrl: internalPath,
      },
      select: {
        id: true,
        photoUrl: true,
        individualProfile: { select: { firstName: true, lastName: true } },
      },
    })

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(internalPath)
    const publicUrl = publicUrlData.publicUrl

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl: publicUrl,
        user: updatedUser,
      },
    })
  } catch (error: any) {
    console.error('Profile photo upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Storage service unavailable: ${error.message || 'Unknown error'}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

