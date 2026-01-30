'use client'

import { useState, useEffect } from 'react'
import { MessageThread } from '@/components/support/MessageThread'
import { useSupportMessages } from '@/lib/supabase/realtime-support'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function DedicatedSupportChat({ applicationId }: { applicationId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMessages = async () => {
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
    }

    // Initial Fetch
    useEffect(() => {
        fetchMessages()
    }, [applicationId])

    // Realtime Hook
    useSupportMessages(applicationId, (newMessage) => {
        fetchMessages()
    })

    const handleSend = async (content: string) => {
        try {
            await fetch(`/api/user/applications/${applicationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            })
            fetchMessages()
        } catch {
            toast.error('Failed to send')
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
                onSendMessage={(c) => handleSend(c)}
                isLoading={loading}
            />
        </div>
    )
}
