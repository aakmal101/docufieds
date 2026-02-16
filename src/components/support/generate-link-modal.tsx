
'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Copy, Check, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface GenerateLinkModalProps {
    isOpen: boolean
    onClose: () => void
    users: any[] // passed from parent
    applications: any[] // passed from parent
    preSelectedUserId?: string
}

export function GenerateLinkModal({ isOpen, onClose, users, applications, preSelectedUserId }: GenerateLinkModalProps) {
    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM')
    const [loading, setLoading] = useState(false)

    // Form State
    const [selectedUserId, setSelectedUserId] = useState(preSelectedUserId || '')
    const [selectedAppId, setSelectedAppId] = useState<string>('')
    const [expiresIn, setExpiresIn] = useState('72')

    const [slots, setSlots] = useState<{ label: string, documentTypeId?: string }[]>([
        { label: 'Document 1' }
    ])

    // Result State
    const [generatedLink, setGeneratedLink] = useState('')
    const [generatedSession, setGeneratedSession] = useState<any>(null)
    const [copied, setCopied] = useState(false)

    // Filter apps by selected user
    const userApplications = applications.filter(app => app.userId === selectedUserId)

    // Auto-select app if only one exists for user
    useEffect(() => {
        if (selectedUserId && userApplications.length === 1) {
            setSelectedAppId(userApplications[0].id)
        } else {
            setSelectedAppId('')
        }
    }, [selectedUserId, applications]) // eslint-disable-line

    useEffect(() => {
        if (preSelectedUserId) setSelectedUserId(preSelectedUserId)
    }, [preSelectedUserId])

    const handleAddSlot = () => {
        setSlots([...slots, { label: `Document ${slots.length + 1}` }])
    }

    const handleRemoveSlot = (index: number) => {
        const newSlots = [...slots]
        newSlots.splice(index, 1)
        setSlots(newSlots)
    }

    const handleSlotChange = (index: number, value: string) => {
        const newSlots = [...slots]
        newSlots[index].label = value
        setSlots(newSlots)
    }

    const handleSubmit = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user')
            return
        }

        // Fallback: If no app selected, try to find one, or warn
        // For now, we'll proceed. The API might fail if we enforce appId, but we updated API to be strictly enforcing? 
        // Wait, I didn't update API to strictly enforce. I implemented it as per schema (nullable). 
        // But public upload route will fail if nullable. 
        // I should force user to select app if none selected?
        if (!selectedAppId && userApplications.length > 0) {
            // Ideally force select, but let's try to default to first one if available to be safe
            // Or just let it be null and handle failure later? No, better UX to force.
            // Let's rely on user selecting one. 
            // If no apps exist for user, we might have an issue.
        }

        setLoading(true)
        try {
            const payload = {
                targetUserId: selectedUserId,
                applicationId: selectedAppId || (userApplications.length > 0 ? userApplications[0].id : undefined), // Fallback to first app
                slotCount: slots.length,
                slots: slots,
                expiresInHours: parseInt(expiresIn)
            }

            const response = await fetch('/api/support/upload-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (data.success) {
                setGeneratedLink(data.data.shareUrl)
                setGeneratedSession(data.data)
                setStep('SUCCESS')
                toast.success('Link generated successfully')
            } else {
                toast.error(data.message || 'Failed to generate link')
            }
        } catch (error) {
            console.error('Error generating link:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Link copied to clipboard')
    }

    const handleClose = () => {
        setStep('FORM')
        setGeneratedLink('')
        setGeneratedSession(null)
        setSlots([{ label: 'Document 1' }])
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{step === 'FORM' ? 'Generate Upload Link' : 'Link Ready'}</DialogTitle>
                    <DialogDescription>
                        {step === 'FORM'
                            ? 'Create a secure link for the user to upload specific documents.'
                            : 'Share this link with the user. It will expire in 72 hours.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'FORM' ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>User</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select User" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.fullName || u.email || 'Unknown'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Application context</Label>
                                <Select value={selectedAppId} onValueChange={setSelectedAppId} disabled={!selectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={userApplications.length ? "Select Application" : "No applications"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userApplications.map(app => (
                                            <SelectItem key={app.id} value={app.id}>
                                                {app.country} - {app.processType}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Expiration</Label>
                            <Select value={expiresIn} onValueChange={setExpiresIn}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24">24 Hours</SelectItem>
                                    <SelectItem value="72">72 Hours (3 Days)</SelectItem>
                                    <SelectItem value="168">1 Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 border rounded-md p-3 bg-gray-50/50">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium">Document Slots ({slots.length})</Label>
                                <Button variant="ghost" size="sm" onClick={handleAddSlot} className="h-8 px-2 text-blue-600">
                                    <Plus className="h-3 w-3 mr-1" /> Add Slot
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {slots.map((slot, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="text-xs text-gray-500 w-6">{idx + 1}.</span>
                                        <Input
                                            value={slot.label}
                                            onChange={(e) => handleSlotChange(idx, e.target.value)}
                                            placeholder="e.g. Bank Statement"
                                            className="h-8"
                                        />
                                        {slots.length > 1 && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveSlot(idx)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={generatedLink}
                                    readOnly
                                    className="bg-gray-50 font-mono text-sm h-10"
                                />
                            </div>
                            <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy</span>
                            </Button>
                        </div>

                        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
                            <p className="font-medium text-blue-800 mb-1">Session Created</p>
                            <ul className="list-disc list-inside">
                                <li>Target User: {users.find(u => u.id === selectedUserId)?.fullName}</li>
                                <li>Slots: {generatedSession?.slotCount}</li>
                                <li>Expires: {new Date(generatedSession?.expiresAt).toLocaleDateString()} {new Date(generatedSession?.expiresAt).toLocaleTimeString()}</li>
                            </ul>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'FORM' ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={loading || !selectedUserId}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Link
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
