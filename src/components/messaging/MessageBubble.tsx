import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Play, Pause, Loader2 } from 'lucide-react'

interface MessageParticipant {
    id: string
    fullName: string | null
    role: string
    photoUrl: string | null
}

export interface UnifiedMessage {
    id: string
    threadId: string
    senderUserId: string
    messageType: 'TEXT' | 'VOICE' | 'SYSTEM'
    text: string | null
    mediaPath: string | null
    mediaMime: string | null
    mediaDurationMs: number | null
    mediaSizeBytes: number | null
    createdAt: string
    senderUser: MessageParticipant
}

interface MessageBubbleProps {
    message: UnifiedMessage
    isMe: boolean
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [progress, setProgress] = useState(0)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const animationRef = useRef<number>()

    // Fetch signed URL on play if voice message
    const handleToggleAudio = async () => {
        if (!audioUrl && message.messageType === 'VOICE') {
            try {
                setIsLoadingAudio(true)
                const res = await fetch(`/api/messaging/messages/${message.id}/media-url`)
                const data = await res.json()
                if (data.success) {
                    setAudioUrl(data.data.url)
                    // Auto play starts when the audio URL is set below
                } else {
                    alert('Unable to play message')
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoadingAudio(false)
            }
        } else if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
                setIsPlaying(false)
            } else {
                audioRef.current.play()
                setIsPlaying(true)
            }
        }
    }

    // Handle auto play after fetch
    useEffect(() => {
        if (audioUrl && audioRef.current && !isPlaying) {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }, [audioUrl])

    const updateProgress = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0)
            animationRef.current = requestAnimationFrame(updateProgress)
        }
    }

    useEffect(() => {
        if (isPlaying) {
            animationRef.current = requestAnimationFrame(updateProgress)
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [isPlaying])

    const handleAudioEnded = () => {
        setIsPlaying(false)
        setProgress(0)
        if (audioRef.current) audioRef.current.currentTime = 0
    }

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // SYSTEM Message
    if (message.messageType === 'SYSTEM') {
        return (
            <div className="flex flex-col items-center my-4 gap-1">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                    {message.text}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(message.createdAt))} ago
                </span>
            </div>
        )
    }

    // Normal Text/Voice
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                {!isMe && (
                    <Avatar className="h-8 w-8 mt-1 border">
                        <AvatarImage src={message.senderUser.photoUrl || undefined} alt={message.senderUser.fullName || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>

                    {/* Message Content Bubble */}
                    <div className={`
                        relative px-3 py-2 text-sm shadow-sm
                        ${isMe
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-none'
                            : 'bg-card border text-card-foreground rounded-2xl rounded-bl-none'
                        }
                    `}>
                        {message.messageType === 'TEXT' && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                        )}

                        {message.messageType === 'VOICE' && (
                            <div className="flex items-center gap-3 min-w-[200px]">
                                <button
                                    onClick={handleToggleAudio}
                                    disabled={isLoadingAudio}
                                    className={`
                                        flex items-center justify-center h-10 w-10 rounded-full shrink-0 transition-colors
                                        ${isMe ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground' : 'bg-primary/10 hover:bg-primary/20 text-primary'}
                                    `}
                                >
                                    {isLoadingAudio ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                    ) : (
                                        <Play className="h-4 w-4 ml-0.5" />
                                    )}
                                </button>

                                <div className="flex-1 flex flex-col gap-1">
                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isMe ? 'bg-primary-foreground/30' : 'bg-primary/20'}`}>
                                        <div
                                            className={`h-full ${isMe ? 'bg-primary-foreground' : 'bg-primary'} transition-all duration-75 ease-linear`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-mono font-medium ${isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                        {formatTime(message.mediaDurationMs || 0)}
                                    </span>
                                </div>

                                {audioUrl && (
                                    <audio
                                        ref={audioRef}
                                        src={audioUrl}
                                        onEnded={handleAudioEnded}
                                        className="hidden"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-muted-foreground px-1">
                        {formatDistanceToNow(new Date(message.createdAt))} ago
                    </span>
                </div>
            </div>
        </div>
    )
}
