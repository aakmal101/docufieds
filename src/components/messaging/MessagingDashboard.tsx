'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ThreadList, ThreadListItem } from './ThreadList'
import { ThreadView } from './ThreadView'
import { Loader2 } from 'lucide-react'

// For standard setups, use the public URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function MessagingDashboard() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [threads, setThreads] = useState<ThreadListItem[]>([])
    const [isLoadingThreads, setIsLoadingThreads] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // We get active thread from URL query param to support deep links
    const activeThreadId = searchParams.get('threadId') || undefined

    useEffect(() => {
        // Fetch user profile to get the current user ID
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data?.id) {
                    setCurrentUserId(data.data.id)
                }
            })
            .catch(err => console.error('Failed to fetch user profile', err))

        const fetchThreads = async () => {
            setIsLoadingThreads(true)
            try {
                const res = await fetch('/api/messaging/threads')
                const data = await res.json()
                if (data.success) {
                    setThreads(data.data)
                }
            } catch (err) {
                console.error('Failed to fetch threads', err)
            } finally {
                setIsLoadingThreads(false)
            }
        }

        fetchThreads()
    }, [])

    const handleSelectThread = (threadId: string) => {
        // Update URL to reflect active thread (supports browser history & deep links)
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set('threadId', threadId)
        router.push(`?${newParams.toString()}`)
    }

    if (!currentUserId) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] w-full border rounded-xl overflow-hidden bg-background shadow-sm">
            {/* Left Sidebar: Chat Heads */}
            <div className="w-1/3 md:w-80 border-r flex flex-col bg-muted/20">
                <div className="p-4 border-b bg-background">
                    <h2 className="font-semibold text-lg">Messages</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                    {isLoadingThreads ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <ThreadList
                            threads={threads}
                            activeThreadId={activeThreadId}
                            onSelectThread={handleSelectThread}
                        />
                    )}
                </div>
            </div>

            {/* Right Pane: Thread View */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {activeThreadId ? (
                    <ThreadView
                        threadId={activeThreadId}
                        currentUserId={currentUserId}
                        supabaseUrl={SUPABASE_URL}
                        supabaseAnonKey={SUPABASE_ANON_KEY}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-accent/20">
                        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Your Messages</h3>
                        <p className="text-sm max-w-sm text-center">Select a conversation from the sidebar to view history, send text and voice messages.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
