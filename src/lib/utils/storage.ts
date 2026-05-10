import { createClient } from '@/lib/supabase/server'

/**
 * Gets a signed URL for a document from the Supabase storage bucket.
 * 
 * @param path The path to the file in the bucket (e.g., 'documents/{userId}/file.pdf')
 * @param expiresIn The number of seconds the signed URL should be valid for (default: 3600 = 1 hour)
 * @returns The signed URL, or null if an error occurred
 */
export async function getSignedDocumentUrl(path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // Determine the bucket based on the path if needed, but assuming 'documents' for most based on context
    // You could also accept bucket as a parameter, but instructions specifically mentioned 'documents'
    const bucket = path.startsWith('photos/') ? 'profiles' : 'documents'

    const { data, error } = await supabase.storage
      .from('documents') // Assuming 'documents' is the primary bucket based on instructions
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('Exception creating signed URL:', err)
    return null
  }
}
