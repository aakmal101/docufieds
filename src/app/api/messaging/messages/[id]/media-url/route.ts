import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// Assuming docufieds uses supabase-js or standard storage approach
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Need to safely initialize Supabase client for storage logic
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback to anon if service missing for testing

// Create a singleton or local instance
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/messaging/messages/[id]/media-url
 * Returns a short-lived signed URL to securely play a voice message.
 */
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

        const messageId = params.id
        const currentUserId = session.user.id

        // Fetch the message and thread to check access
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId },
            include: {
                thread: {
                    include: {
                        participants: true
                    }
                }
            }
        })

        if (!message) {
            return NextResponse.json(
                { success: false, message: 'Message not found' },
                { status: 404 }
            )
        }

        // Verify the user is a participant of this thread
        const isParticipant = message.thread.participants.some(p => p.userId === currentUserId)

        if (!isParticipant) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 } // Requirement: 403 Forbidden for RBAC negative test
            )
        }

        if (message.messageType !== 'VOICE' || !message.mediaPath) {
            return NextResponse.json(
                { success: false, message: 'Not a voice message' },
                { status: 400 }
            )
        }

        // Generate signed URL (valid for say, 60 seconds)
        // Adjust the bucket name 'voice_messages' to match actual Supabase storage config later if needed
        const { data, error } = await supabase
            .storage
            .from('voice_messages')
            .createSignedUrl(message.mediaPath, 60)

        if (error) {
            console.error('Supabase signed URL error:', error)
            return NextResponse.json(
                { success: false, message: 'Failed to generate media URL' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: { url: data.signedUrl }
        })

    } catch (error) {
        console.error('Media URL error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
