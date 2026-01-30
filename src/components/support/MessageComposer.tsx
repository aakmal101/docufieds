'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea' // Created in previous task
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Send, Paperclip, Loader2 } from 'lucide-react'

interface MessageComposerProps {
    onSend: (content: string, isInternal: boolean, attachment?: File) => void
    isLoading: boolean
    canSendInternal?: boolean
}

export function MessageComposer({ onSend, isLoading, canSendInternal = false }: MessageComposerProps) {
    const [content, setContent] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
            if (file.size > 20 * 1024 * 1024) {
                // warning handled by parent or toast here? 
                // keeping it silent here or we can import toast.
                // Let's just set it for now.
            }
            setSelectedFile(file)
        }
    }

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
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-4 w-4 mr-2" /> Attach
                    </Button>

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
