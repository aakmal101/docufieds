'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

export interface ThreadListItem {
    id: string
    threadKey: string
    type: string
    lastMessageAt: string | null
    lastMessagePreview: string
    hasUnread: boolean
    others: {
        userId: string
        fullName: string | null
        role: string
        photoUrl: string | null
    }[]
}

interface ThreadListProps {
    threads: ThreadListItem[]
    activeThreadId?: string
    onSelectThread: (threadId: string) => void
}

export function ThreadList({ threads, activeThreadId, onSelectThread }: ThreadListProps) {
    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
                <p className="text-sm">No conversations yet.</p>
                <p className="text-xs">Start a chat from a profile to begin.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full h-full overflow-y-auto divide-y bg-background">
            {threads.map((thread) => {
                const isActive = thread.id === activeThreadId
                // If it's a DM, "others" will just have 1 person
                const otherParticipant = thread.others[0]
                const displayName = otherParticipant?.fullName || 'Unknown User'
                const displayPhoto = otherParticipant?.photoUrl

                return (
                    <button
                        key={thread.id}
                        onClick={() => onSelectThread(thread.id)}
                        className={`flex items-start gap-3 p-4 w-full text-left transition-colors hover:bg-accent ${isActive ? 'bg-accent font-medium' : ''}`}
                    >
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={displayPhoto || undefined} alt={displayName} />
                            <AvatarFallback className="bg-primary/10">
                                <User className="h-5 w-5 text-primary/60" />
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm truncate ${thread.hasUnread ? 'font-semibold' : 'font-medium'}`}>
                                    {displayName}
                                </span>
                                {thread.lastMessageAt && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                                <p className={`text-xs truncate ${thread.hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                    {thread.lastMessagePreview}
                                </p>
                                {thread.hasUnread && (
                                    <Badge className="h-2 w-2 rounded-full p-0 flex-shrink-0" />
                                )}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
