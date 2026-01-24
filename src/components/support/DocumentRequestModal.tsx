'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface DocumentRequestModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (docType: string, reason: string, instructions: string) => Promise<void>
}

export function DocumentRequestModal({ isOpen, onClose, onSubmit }: DocumentRequestModalProps) {
    const [docType, setDocType] = useState('')
    const [reason, setReason] = useState('')
    const [instructions, setInstructions] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!docType || !reason) return
        setLoading(true)
        try {
            await onSubmit(docType, reason, instructions)
            onClose()
            setDocType('')
            setReason('')
            setInstructions('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Additional Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select value={docType} onValueChange={setDocType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                                <SelectItem value="Proof of Address">Proof of Address</SelectItem>
                                <SelectItem value="Employment Letter">Employment Letter</SelectItem>
                                <SelectItem value="Tax Return">Tax Return</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason for Request</Label>
                        <Textarea
                            placeholder="Why is this document needed?"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Additional Instructions (Optional)</Label>
                        <Textarea
                            placeholder="Any specific format or details?"
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !docType || !reason}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
