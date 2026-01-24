'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar' // Assuming components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea' // Need to create if missing
import { Loader2, Check, X, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RejectionsPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Action State
    const [actionOpen, setActionOpen] = useState(false)
    const [selectedReq, setSelectedReq] = useState<string | null>(null)
    const [actionType, setActionType] = useState<'APPROVE' | 'DENY'>('APPROVE')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/support-lead/rejections')
            if (res.ok) setRequests(await res.json())
        } catch { }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchRequests() }, [])

    const openAction = (id: string, type: 'APPROVE' | 'DENY') => {
        setSelectedReq(id)
        setActionType(type)
        setNotes('')
        setActionOpen(true)
    }

    const handleExecute = async () => {
        if (!selectedReq) return
        setSubmitting(true)
        try {
            // Determine endpoint based on type
            const endpoint = actionType === 'APPROVE' ? 'approve' : 'deny'
            const res = await fetch(`/api/admin/support-lead/rejections/${selectedReq}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadNotes: notes })
            })
            if (res.ok) {
                toast.success(`Rejection ${actionType === 'APPROVE' ? 'Approved' : 'Denied'}`)
                setActionOpen(false)
                fetchRequests()
            } else {
                toast.error('Failed to process')
            }
        } catch { toast.error('Error') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Rejection Approvals</h1>
                <p className="text-gray-500">Review and approve application rejection requests.</p>
            </div>

            {loading ? <Loader2 className="animate-spin" /> : requests.length === 0 ? <p className="text-gray-500">No pending rejection requests.</p> :
                <div className="grid gap-4">
                    {requests.map(req => (
                        <Card key={req.id} className="border-l-4 border-l-orange-400">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="secondary" className="mb-2">{req.category}</Badge>
                                        <CardTitle className="text-lg">Applicant: {req.application.user.fullName}</CardTitle>
                                        <CardDescription>{req.application.user.email}</CardDescription>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="text-gray-500">Requested by</p>
                                        <div className="flex items-center justify-end gap-2 mt-1">
                                            <span className="font-medium">{req.requestedBy.fullName}</span>
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={req.requestedBy.photoUrl} />
                                                <AvatarFallback>M</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 p-4 rounded mb-4">
                                    <h4 className="font-semibold text-sm mb-1">Reason for Rejection:</h4>
                                    <p className="text-sm text-gray-700">{req.reason}</p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => openAction(req.id, 'DENY')}>
                                        <X className="h-4 w-4 mr-2" /> Deny (Return)
                                    </Button>
                                    <Button variant="destructive" onClick={() => openAction(req.id, 'APPROVE')}>
                                        <Check className="h-4 w-4 mr-2" /> Approve Rejection
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }

            {/* Confirmation Dialog */}
            <Dialog open={actionOpen} onOpenChange={setActionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm {actionType === 'APPROVE' ? 'Rejection' : 'Return'}</DialogTitle>
                        <DialogDescription>
                            {actionType === 'APPROVE'
                                ? 'This will permanently reject the application and notify the user.'
                                : 'This will return the application to the member for further review.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                        <textarea
                            className="w-full min-h-[100px] p-2 border rounded-md text-sm"
                            placeholder="Add notes for the team..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActionOpen(false)}>Cancel</Button>
                        <Button
                            variant={actionType === 'APPROVE' ? 'destructive' : 'default'}
                            onClick={handleExecute}
                            disabled={submitting}
                        >
                            {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            {actionType === 'APPROVE' ? 'Confirm Reject' : 'Confirm Return'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
