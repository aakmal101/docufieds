'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Send, Paperclip, Loader2, Mic, StopCircle, Play, Pause, Trash2 } from 'lucide-react'

interface MessageComposerProps {
    onSend: (content: string, isInternal: boolean, attachment?: File) => void
    onSendVoice?: (blob: Blob, durationMs: number) => void
    isLoading: boolean
    canSendInternal?: boolean
}

export function MessageComposer({ onSend, onSendVoice, isLoading, canSendInternal = false }: MessageComposerProps) {
    const [content, setContent] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [isPlayingPreview, setIsPlayingPreview] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const recordingStartRef = useRef<number>(0)
    const previewAudioRef = useRef<HTMLAudioElement | null>(null)

    const handleSend = () => {
        if (!content.trim() && !selectedFile) return
        onSend(content, isInternal, selectedFile || undefined)
        setContent('')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
        }
    }

    // ── Voice Recording ──
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
                setRecordedBlob(blob)
                stream.getTracks().forEach(t => t.stop())
            }

            recorder.start()
            recordingStartRef.current = Date.now()
            setIsRecording(true)
            setRecordedBlob(null)

            // Timer to show elapsed seconds
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - recordingStartRef.current) / 1000))
            }, 500)
        } catch (err) {
            console.error('Microphone access denied:', err)
            alert('Please allow microphone access to record voice messages.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }

    const cancelRecording = () => {
        stopRecording()
        setRecordedBlob(null)
        setRecordingDuration(0)
    }

    const handleSendVoice = () => {
        if (!recordedBlob || !onSendVoice) return
        const durationMs = recordingDuration * 1000
        onSendVoice(recordedBlob, durationMs)
        setRecordedBlob(null)
        setRecordingDuration(0)
    }

    const togglePlayback = () => {
        if (!recordedBlob) return
        if (isPlayingPreview && previewAudioRef.current) {
            previewAudioRef.current.pause()
            setIsPlayingPreview(false)
            return
        }
        const url = URL.createObjectURL(recordedBlob)
        const audio = new Audio(url)
        previewAudioRef.current = audio
        audio.onended = () => setIsPlayingPreview(false)
        audio.play()
        setIsPlayingPreview(true)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // ── Recording UI ──
    if (isRecording) {
        return (
            <div className="p-3 border-t bg-red-50 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-700">Recording {formatTime(recordingDuration)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-gray-500">
                    <Trash2 className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white">
                    <StopCircle className="h-4 w-4 mr-1" /> Stop
                </Button>
            </div>
        )
    }

    // ── Recorded preview UI ──
    if (recordedBlob) {
        return (
            <div className="p-3 border-t bg-green-50 flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={togglePlayback}>
                    {isPlayingPreview ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                    <div className="h-2 bg-green-200 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: isPlayingPreview ? '100%' : '0%', transition: 'width 0.3s' }} />
                    </div>
                    <span className="text-xs text-green-700 mt-1">{formatTime(recordingDuration)} voice message</span>
                </div>
                <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-gray-500">
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSendVoice} disabled={isLoading || !onSendVoice} className="bg-green-600 hover:bg-green-700 text-white">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Send
                </Button>
            </div>
        )
    }

    // ── Normal text composer ──
    return (
        <div className="p-3 border-t bg-gray-50 space-y-2">
            {selectedFile && (
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded text-sm text-blue-700 w-fit">
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[200px] truncate">{selectedFile.name}</span>
                    <button onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                    }} className="ml-2 hover:text-blue-900">×</button>
                </div>
            )}
            <Textarea
                placeholder={isInternal ? "Add an internal note..." : "Type your message..."}
                className={`bg-white min-h-[60px] resize-none ${isInternal ? 'bg-yellow-50 border-yellow-200' : ''}`}
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-4 w-4 mr-1" /> Attach
                    </Button>

                    {onSendVoice && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-600"
                            onClick={startRecording}
                            title="Record a voice message"
                        >
                            <Mic className="h-4 w-4 mr-1" /> Voice
                        </Button>
                    )}

                    {canSendInternal && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="internal"
                                checked={isInternal}
                                onCheckedChange={(c) => setIsInternal(c as boolean)}
                            />
                            <Label htmlFor="internal" className="text-sm text-gray-600 font-normal">Internal Note</Label>
                        </div>
                    )}
                </div>

                <Button onClick={handleSend} disabled={isLoading || (!content.trim() && !selectedFile)} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send
                </Button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    )
}
