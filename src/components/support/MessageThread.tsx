'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { User, Lock, Paperclip, Play, Pause } from 'lucide-react'
import { MessageComposer } from './MessageComposer'

export interface Message {
    id: string
    content: string
    messageType: string
    senderType: string
    senderUser?: { fullName: string | null }
    senderMember?: { fullName: string }
    createdAt: string
    isInternal: boolean
    attachmentUrl?: string | null
    attachmentName?: string | null
}

interface MessageThreadProps {
    messages: Message[]
    currentUserType: 'USER' | 'SUPPORT_MEMBER'
    onSendMessage?: (content: string, isInternal: boolean, attachment?: File) => void
    onSendVoice?: (blob: Blob, durationMs: number) => void
    isLoading?: boolean
}

export function MessageThread({ messages, currentUserType, onSendMessage, onSendVoice, isLoading }: MessageThreadProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleToggleVoice = (msgId: string, url: string) => {
        if (playingId === msgId) {
            audioRef.current?.pause()
            setPlayingId(null)
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            const audio = new Audio(url)
            audioRef.current = audio
            audio.onplay = () => setPlayingId(msgId)
            audio.onpause = () => setPlayingId(null)
            audio.onended = () => {
                setPlayingId(null)
                setProgress(0)
            }
            audio.ontimeupdate = () => {
                setProgress((audio.currentTime / audio.duration) * 100 || 0)
            }
            audio.play()
        }
    }

    const formatDuration = (content: string) => {
        try {
            const data = JSON.parse(content)
            if (data.durationMs) {
                const s = Math.floor(data.durationMs / 1000)
                const m = Math.floor(s / 60)
                return `${m}:${(s % 60).toString().padStart(2, '0')}`
            }
        } catch { }
        return 'Voice'
    }

    return (
        <Card className="h-[600px] flex flex-col border shadow-sm">
            <CardHeader className="border-b px-4 py-3 bg-gray-50/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    {currentUserType === 'SUPPORT_MEMBER' ? 'Conversation & Notes' : 'Support Chat'}
                </CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No messages yet.
                        </div>
                    )}

                    {messages.map((msg) => {
                        const isInternal = msg.isInternal
                        if (currentUserType === 'USER' && isInternal) return null

                        const isMe = (currentUserType === 'USER' && msg.senderType === 'USER') ||
                            (currentUserType === 'SUPPORT_MEMBER' && (msg.senderType === 'SUPPORT_MEMBER' || msg.senderType === 'AGENT'))

                        if (msg.messageType === 'SYSTEM' || msg.messageType === 'DOCUMENT_REQUEST') {
                            return (
                                <div key={msg.id} className="flex flex-col items-center my-4 gap-1">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                                        {msg.content}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {formatDistanceToNow(new Date(msg.createdAt))} ago
                                    </span>
                                </div>
                            )
                        }

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <Avatar className="h-8 w-8 mt-1 border">
                                        <AvatarFallback className={msg.senderType === 'USER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                                            {msg.senderType === 'USER' ? <User className="h-4 w-4" /> : 'S'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`
                                            relative px-4 py-2 rounded-2xl text-sm shadow-sm
                                            ${isInternal
                                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-bl-none'
                                                : isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white border text-gray-900 rounded-bl-none'
                                            }
                                        `}>
                                            {isInternal && (
                                                <div className="flex items-center gap-1 text-xs font-bold text-yellow-700 mb-1 opacity-80">
                                                    <Lock className="h-3 w-3" /> Internal Note
                                                </div>
                                            )}

                                            {msg.messageType === 'VOICE' ? (
                                                <div className="flex items-center gap-3 min-w-[180px] py-1">
                                                    <button
                                                        onClick={() => msg.attachmentUrl && handleToggleVoice(msg.id, msg.attachmentUrl)}
                                                        className={`flex items-center justify-center h-8 w-8 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}
                                                    >
                                                        {playingId === msg.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className={`h-1 rounded-full ${isMe ? 'bg-white/30' : 'bg-gray-200'} overflow-hidden`}>
                                                            <div
                                                                className={`h-full ${isMe ? 'bg-white' : 'bg-blue-600'} transition-all`}
                                                                style={{ width: playingId === msg.id ? `${progress}%` : '0%' }}
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                                            {formatDuration(msg.content)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}

                                            {msg.attachmentUrl && msg.messageType !== 'VOICE' && (
                                                <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
                                                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs underline opacity-90 hover:opacity-100">
                                                        <Paperclip className="h-3 w-3" />
                                                        {msg.attachmentName || 'Attachment'}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 px-1">
                                            {msg.senderType === 'SUPPORT_MEMBER' && !isMe ? `${msg.senderMember?.fullName} • ` : ''}
                                            {msg.senderType === 'AGENT' && !isMe ? `${msg.senderUser?.fullName} (Agent) • ` : ''}
                                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>

            {(onSendMessage || onSendVoice) && (
                <MessageComposer
                    onSend={onSendMessage || (() => { })}
                    onSendVoice={onSendVoice}
                    isLoading={!!isLoading}
                    canSendInternal={currentUserType === 'SUPPORT_MEMBER'}
                />
            )}
        </Card>
    )
}

