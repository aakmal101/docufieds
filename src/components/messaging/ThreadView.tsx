'use client'

import { useState, useEffect, useRef } from 'react'
import { Composer } from './Composer'
import { MessageBubble, UnifiedMessage } from './MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ThreadViewProps {
    threadId: string
    currentUserId: string
    supabaseUrl: string
    supabaseAnonKey: string
}

export function ThreadView({ threadId, currentUserId, supabaseUrl, supabaseAnonKey }: ThreadViewProps) {
    const [messages, setMessages] = useState<UnifiedMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Initial load
    useEffect(() => {
        if (!threadId) return
        let isMounted = true

        const fetchMessages = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`/api/messaging/messages?threadId=${threadId}`)
                const data = await res.json()
                if (data.success && isMounted) {
                    // API returns newest first (desc), we want to display oldest first (asc)
                    setMessages(data.data.reverse())
                }
            } catch (err) {
                console.error('Failed to fetch messages', err)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        fetchMessages()

        // Setup Realtime Subscription
        const supabase = createClient()
        const channel = supabase.channel(`realtime-thread-${threadId}`)

        channel.on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `thread_id=eq.${threadId}`
        }, (payload) => {
            const newDbMessage = payload.new as any

            // Avoid duplicate rendering if this was the message we just sent ourselves
            if (newDbMessage.sender_user_id !== currentUserId) {
                // To get full senderUser info we might need to fetch it, but usually the senderUser 
                // data isn't joined in the realtime payload. We can do a quick fetch for the missing data 
                // or just append enough to show the message bubble.
                fetch(`/api/messaging/messages?threadId=${threadId}&limit=1`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.data.length > 0) {
                            const fullMsg = data.data[0]
                            setMessages(prev => {
                                if (prev.some(m => m.id === fullMsg.id)) return prev
                                return [...prev, fullMsg]
                            })
                        }
                    })
            }
        }).subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [threadId])

    // Scroll to bottom on load/new message
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current
            // Simple smooth scroll to bottom
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        }
    }, [messages])

    const handleSendMessage = async (text: string) => {
        setIsSending(true)
        try {
            const res = await fetch('/api/messaging/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, text })
            })
            const data = await res.json()
            if (data.success) {
                setMessages(prev => [...prev, data.data])
            }
        } catch (err) {
            console.error('Failed to send text', err)
            alert('Failed to send text message')
        } finally {
            setIsSending(false)
        }
    }

    const handleSendVoice = async (blob: Blob, durationMs: number) => {
        setIsSending(true)
        try {
            // Upload to Supabase Storage Directly
            const supabase = createClient()

            // Create a unique message ID early for the file path
            const dummyId = `voice_${Date.now()}`
            const filePath = `voice/${threadId}/${dummyId}.webm`

            const { data: uploadData, error } = await supabase.storage
                .from('voice_messages')
                .upload(filePath, blob, {
                    contentType: blob.type
                })

            if (error) {
                console.error('Upload Error:', error)
                throw new Error('Failed to upload file')
            }

            // Now create the Message record pointing to `filePath`
            // We need a specific endpoint or add voice handling to existing POST.
            // Let's call a specific endpoint or re-use POST with different payload based on our design.
            const res = await fetch('/api/messaging/messages/voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    mediaPath: uploadData.path,
                    mime: blob.type,
                    durationMs,
                    sizeBytes: blob.size
                })
            })

            const resData = await res.json()
            if (resData.success) {
                setMessages(prev => [...prev, resData.data])
            } else {
                alert('Voice uploaded but failed to create message record')
            }
        } catch (err) {
            console.error('Voice send failed', err)
            alert('Failed to send voice message')
        } finally {
            setIsSending(false)
        }
    }

    if (!threadId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-accent/20">
                <p>Select a chat to start messaging</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Header / Thread Info could go here */}

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto w-full"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs">Start the conversation below!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isMe={msg.senderUserId === currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Composer Area */}
            <Composer
                onSendMessage={handleSendMessage}
                onSendVoice={handleSendVoice}
                disabled={isSending || isLoading || threadId.startsWith('legacy_user_')}
            />
        </div>
    )
}
