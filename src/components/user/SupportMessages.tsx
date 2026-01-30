'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MessageThread } from '@/components/support/MessageThread'
import { Button } from '@/components/ui/button'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { useSupportMessages } from '@/lib/supabase/realtime-support'

export function SupportMessages({ applicationId }: { applicationId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/user/applications/${applicationId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                // Count unread 
                // Simple logic for now: if we are fetched, we are read. 
                // Real unread logic needs persistent check.
            }
        } catch { } finally { setLoading(false) }
    }

    // Initial Fetch
    useEffect(() => {
        if (isOpen) fetchMessages()
    }, [isOpen, applicationId])

    // Realtime Hook
    useSupportMessages(applicationId, (newMessage) => {
        // Optimistic append, but safer to re-fetch to get sender details (which are relations not in raw payload)
        // Raw payload only has IDs. 
        // So we call fetchMessages to get full data.
        fetchMessages()
        if (!isOpen) {
            // If closed, increment local unread count or similar logic could go here.
            // Simplified: Notification badge elsewhere handles app-wide notifications.
        }
    })

    const handleSend = async (content: string, isInternal: boolean, attachment?: File) => {
        try {
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

            await fetch(`/api/user/applications/${applicationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    attachmentUrl,
                    attachmentName
                })
            })
            fetchMessages()
        } catch { toast.error('Failed to send') }
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full border rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Support Messages</h3>
                        <p className="text-sm text-gray-500">Contact the support team directly.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Badge could go here */}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
            </div>

            <CollapsibleContent>
                <div className="px-4 pb-4">
                    <MessageThread
                        messages={messages}
                        currentUserType="USER"
                        onSendMessage={(c, i, a) => handleSend(c, i, a)}
                        isLoading={loading}
                    />
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
