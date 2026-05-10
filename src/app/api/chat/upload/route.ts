import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const user = await getCurrentUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const applicationId = formData.get('applicationId') as string

        if (!file || !applicationId) {
            return NextResponse.json({ error: 'Missing file or applicationId' }, { status: 400 })
        }

        const supabase = await createClient()
        const fileName = `${applicationId}/${Date.now()}-${file.name}`

        // Upload to a 'chat-attachments' folder or bucket. 
        // We'll use the 'documents' bucket but in a specific folder.
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(`chat/${fileName}`, file)

        if (error) throw error

        const internalPath = `chat/${fileName}`
        
        const { getSignedDocumentUrl } = await import('@/lib/utils/storage');
        const signedUrl = await getSignedDocumentUrl(internalPath) || internalPath;

        return NextResponse.json({ url: signedUrl, path: internalPath, name: file.name })
    } catch (error) {
        console.error('Chat upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
