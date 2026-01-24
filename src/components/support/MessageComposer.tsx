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
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSend = () => {
        if (!content.trim()) return
        onSend(content, isInternal)
        setContent('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="p-3 border-t bg-gray-50 space-y-2">
            <Textarea
                placeholder={isInternal ? "Add an internal note (only visible to team)..." : "Type your message..."}
                className={`bg-white min-h-[60px] resize-none ${isInternal ? 'bg-yellow-50 border-yellow-200' : ''}`}
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="ghost" size="sm" className="text-gray-500">
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

                <Button onClick={handleSend} disabled={isLoading || !content.trim()} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send
                </Button>
            </div>
            {/* Hidden file input for future implementation */}
            <input type="file" ref={fileInputRef} className="hidden" />
        </div>
    )
}
