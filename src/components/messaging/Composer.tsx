import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Mic, Send, StopCircle, Play, Pause, Trash2 } from 'lucide-react'

// Extended window types for web API
declare global {
    interface Window {
        MediaStreamTrack: any;
    }
}

interface ComposerProps {
    onSendMessage: (text: string) => void
    onSendVoice: (blob: Blob, durationMs: number) => void
    disabled?: boolean
}

export function Composer({ onSendMessage, onSendVoice, disabled }: ComposerProps) {
    const [text, setText] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
    const [recordingDuration, setRecordingDuration] = useState(0)

    // Preview playback state
    const [isPlaying, setIsPlaying] = useState(false)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<BlobPart[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioElRef = useRef<HTMLAudioElement | null>(null)
    const startTimeRef = useRef<number>(0)

    // Handlers
    const handleSendText = () => {
        if (!text.trim() || disabled) return
        onSendMessage(text)
        setText('')
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data)
                }
            }

            // Mime types can vary across browsers. WebM/Opus is common. 
            // We just let the browser use its default.
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                setAudioPreviewUrl(URL.createObjectURL(blob))
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setRecordingDuration(0)
            startTimeRef.current = Date.now()

            timerRef.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))

                // Max 3 mins
                if (Date.now() - startTimeRef.current > 180000) {
                    stopRecording()
                }
            }, 1000)

        } catch (err) {
            console.error('Mic access error:', err)
            alert('Microphone access is required to send voice messages.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        stopRecording()
        setAudioBlob(null)
        setAudioPreviewUrl(null)
        setRecordingDuration(0)
    }

    const handleSendVoice = () => {
        if (audioBlob && !disabled) {
            // Estimate duration exactly (or pass the tracked one in MS)
            const exactDurationMs = (recordingDuration * 1000) || 1000
            onSendVoice(audioBlob, exactDurationMs)

            // Reset
            setAudioBlob(null)
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
            setAudioPreviewUrl(null)
            setRecordingDuration(0)
        }
    }

    const togglePlayback = () => {
        if (audioElRef.current) {
            if (isPlaying) {
                audioElRef.current.pause()
            } else {
                audioElRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col gap-2 p-3 bg-background border-t">
            {isRecording ? (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                    <span className="font-mono flex-1">{formatTime(recordingDuration)}</span>
                    <Button variant="ghost" size="icon" onClick={cancelRecording} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="sm" onClick={stopRecording} className="bg-red-600 hover:bg-red-700">
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop
                    </Button>
                </div>
            ) : audioBlob ? (
                <div className="flex items-center gap-3 bg-accent/50 p-3 rounded-lg border">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={togglePlayback}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>
                    <span className="font-mono text-sm">{formatTime(recordingDuration)}</span>
                    <div className="flex-1 h-2 bg-primary/20 rounded-full overflow-hidden">
                        {/* Fake audio waveform for preview */}
                        <div className="h-full bg-primary/60 w-full" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)' }}></div>
                    </div>
                    <audio
                        ref={audioElRef}
                        src={audioPreviewUrl!}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />

                    <Button variant="ghost" size="icon" onClick={cancelRecording} className="h-8 w-8 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSendVoice} disabled={disabled}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Voice
                    </Button>
                </div>
            ) : (
                <div className="flex items-end gap-2">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendText()
                            }
                        }}
                        placeholder="Type a message..."
                        className="min-h-[60px] max-h-[150px] resize-none pb-9"
                        disabled={disabled}
                    />
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={startRecording}
                            title="Send Voice Message"
                            disabled={disabled || text.trim().length > 0}
                        >
                            <Mic className="h-5 w-5" />
                        </Button>
                        <Button
                            className="h-10 w-10 shrink-0 rounded-full"
                            onClick={handleSendText}
                            disabled={disabled || !text.trim()}
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
