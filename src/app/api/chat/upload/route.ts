import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(`chat/${fileName}`)

        return NextResponse.json({ url: publicUrl, name: file.name })
    } catch (error) {
        console.error('Chat upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
