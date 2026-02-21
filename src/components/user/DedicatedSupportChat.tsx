import { useState, useEffect, useCallback } from 'react'
import { MessageThread } from '@/components/support/MessageThread'
import { useSupportMessages } from '@/lib/supabase/realtime-support'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function DedicatedSupportChat({ applicationId }: { applicationId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/user/applications/${applicationId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch {
            toast.error('Failed to load messages')
        } finally {
            setLoading(false)
        }
    }, [applicationId])

    // Initial Fetch
    useEffect(() => {
        fetchMessages()
    }, [fetchMessages])

    // Realtime Hook
    useSupportMessages(applicationId, fetchMessages)


    const [submitting, setSubmitting] = useState(false)

    const handleSend = async (content: string, isInternal: boolean, attachment?: File) => {
        try {
            setSubmitting(true)
            let attachmentUrl = undefined
            let attachmentName = undefined

            if (attachment) {
                const formData = new FormData()
                formData.append('file', attachment)
                formData.append('applicationId', applicationId)

                const uploadRes = await fetch('/api/chat/upload', {
                    method: 'POST',
                    body: formData
                })

                if (!uploadRes.ok) throw new Error('Upload failed')
                const uploadData = await uploadRes.json()
                attachmentUrl = uploadData.url
                attachmentName = uploadData.name
            }

            const res = await fetch(`/api/user/applications/${applicationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    attachmentUrl,
                    attachmentName
                })
            })

            if (!res.ok) throw new Error('Failed to send')

            toast.success('Message sent')
            fetchMessages()
        } catch (error) {
            console.error('Send error:', error)
            toast.error('Failed to send')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSendVoice = async (blob: Blob, durationMs: number) => {
        try {
            setSubmitting(true)
            const formData = new FormData()
            const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
            formData.append('file', file)
            formData.append('applicationId', applicationId)

            const uploadRes = await fetch('/api/chat/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Upload failed')
            const uploadData = await uploadRes.json()

            const res = await fetch(`/api/user/applications/${applicationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: JSON.stringify({ durationMs }),
                    attachmentUrl: uploadData.url,
                    attachmentName: 'voice-message.webm',
                    messageType: 'VOICE'
                })
            })

            if (!res.ok) throw new Error('Failed to send')

            toast.success('Voice message sent')
            fetchMessages()
        } catch (error) {
            console.error('Voice send error:', error)
            toast.error('Failed to send voice message')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-white border rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="h-full">
            <MessageThread
                messages={messages}
                currentUserType="USER"
                onSendMessage={(c, i, a) => handleSend(c, i, a)}
                onSendVoice={handleSendVoice}
                isLoading={submitting}
            />
        </div>
    )
}

