'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentReview } from '@/components/support/DocumentReview'
import { MessageThread } from '@/components/support/MessageThread'
import { useSupportMessages } from '@/lib/supabase/realtime-support'
import { DocumentRequestModal } from '@/components/support/DocumentRequestModal'
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, XCircle, DollarSign, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { AnimatedConfirmDialog } from '@/components/ui/animated-confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentVerificationTab } from '@/components/support/PaymentVerificationTab'

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Modals state
    const [escalateOpen, setEscalateOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [docReqOpen, setDocReqOpen] = useState(false)
    const [legalConfirmOpen, setLegalConfirmOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Messages
    const [messages, setMessages] = useState<any[]>([])

    // Fetch App
    const fetchApp = async () => {
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}`)
            if (res.ok) setApp(await res.json())
        } catch (e) { toast.error('Failed to load') }
        finally { setLoading(false) }
    }

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}/messages`)
            if (res.ok) setMessages(await res.json())
        } catch { }
    }, [params.id])

    useEffect(() => {
        if (app?.id) {
            fetchMessages()
        }
    }, [app?.id, fetchMessages])

    // Realtime support messages
    useSupportMessages(params.id, fetchMessages)

    useEffect(() => { fetchApp() }, [params.id])

    const handleSendMessage = async (content: string, isInternal: boolean, attachment?: File) => {
        try {
            let attachmentUrl = undefined
            let attachmentName = undefined

            if (attachment) {
                const formData = new FormData()
                formData.append('file', attachment)
                formData.append('applicationId', params.id)

                const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData })
                if (uploadRes.ok) {
                    const data = await uploadRes.json()
                    attachmentUrl = data.url
                    attachmentName = data.name
                } else {
                    toast.error('Failed to upload attachment')
                    return
                }
            }

            await fetch(`/api/admin/support-member/applications/${params.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isInternal, attachmentUrl, attachmentName })
            })
            fetchMessages()
        } catch { toast.error('Failed to send') }
    }

    const handleSendVoice = async (blob: Blob, durationMs: number) => {
        try {
            const formData = new FormData()
            const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
            formData.append('file', file)
            formData.append('applicationId', params.id)

            const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData })
            if (!uploadRes.ok) throw new Error('Upload failed')
            const uploadData = await uploadRes.json()

            await fetch(`/api/admin/support-member/applications/${params.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: JSON.stringify({ durationMs }),
                    attachmentUrl: uploadData.url,
                    attachmentName: 'voice-message.webm',
                    messageType: 'VOICE',
                    isInternal: false
                })
            })
            fetchMessages()
        } catch { toast.error('Failed to send voice message') }
    }


    const handleDocumentRequest = async (docType: string, reason: string, instructions: string) => {
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}/request-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentType: docType, reason, instructions })
            })
            if (res.ok) {
                toast.success('Document requested')
                fetchApp() // Update app status
                fetchMessages() // Update chat with sys msg
            }
        } catch { toast.error('Failed') }
    }

    // Actions
    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                toast.success('Status updated')
                fetchApp()
            }
        } catch { toast.error('Failed') }
    }

    const handleEscalate = async () => {
        setSubmitting(true)
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}/escalate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            })
            if (res.ok) {
                toast.success("Application Escalated")
                setEscalateOpen(false)
                fetchApp()
            } else {
                toast.error("Failed to escalate")
            }
        } catch { toast.error("Error escalating") }
        finally { setSubmitting(false) }
    }

    const handleRequestRejection = async () => {
        setSubmitting(true)
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}/request-rejection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, category: 'OTHER' }) // Default category for now
            })
            if (res.ok) {
                toast.success("Rejection Requested")
                setRejectOpen(false)
                fetchApp()
            } else {
                toast.error("Failed to request rejection")
            }
        } catch { toast.error("Error requesting rejection") }
        finally { setSubmitting(false) }
    }

    const handleForwardToLegal = async () => {
        // Confirmation is now handled by UI
        setSubmitting(true)
        try {
            const res = await fetch(`/api/admin/support-member/applications/${params.id}/forward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination: 'LEGAL' })
            })
            if (res.ok) {
                toast.success("Forwarded to Legal")
                fetchApp()
                setLegalConfirmOpen(false)
            } else {
                toast.error("Failed to forward")
            }
        } catch { toast.error("Error forwarding") }
        finally { setSubmitting(false) }
    }

    if (loading || !app) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6 pb-24"> {/* pb-24 for fixed bottom bar */}
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/support-member">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {app.user.fullName}
                        <Badge variant="outline" className="text-base">{app.processType}</Badge>
                    </h1>
                    <p className="text-gray-500">ID: {app.id}</p>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full" id="app-tabs">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Applicant Info</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500">Email</p>
                                        <p className="font-medium">{app.user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Phone</p>
                                        <p className="font-medium">{app.user.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Destination</p>
                                        <p className="font-medium">{app.country}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Submitted</p>
                                        <p className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Consultancy Fee</p>
                                        <p className="font-medium text-blue-600">
                                            {app.consultancyFee ? `${app.consultancyFee.toLocaleString()} BDT` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Application Status</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Current Status</p>
                                    <Select value={app.supportStatus} onValueChange={handleStatusChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                            <SelectItem value="Waiting for User">Waiting for User</SelectItem>
                                            <SelectItem value="VERIFIED">Verified</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Payment Status</p>
                                    <Badge variant={app.payments?.[0]?.status === 'PAID' || app.payments?.[0]?.status === 'VERIFIED' ? 'default' : 'secondary'}>
                                        {app.payments?.[0]?.status || 'PENDING'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Application Documents</h3>
                        <Button variant="outline" size="sm" onClick={() => setDocReqOpen(true)}>
                            Request Additional
                        </Button>
                    </div>
                    <DocumentReview
                        documents={app.documents}
                        applicationId={app.id}
                        onUpdate={fetchApp}
                    />
                </TabsContent>

                <TabsContent value="payment">
                    <PaymentVerificationTab
                        applicationId={app.id}
                        payment={app.payments?.[0]}
                        onUpdate={fetchApp}
                    />
                </TabsContent>

                <TabsContent value="messages">
                    <MessageThread
                        messages={messages}
                        currentUserType="SUPPORT_MEMBER"
                        onSendMessage={(c, i, a) => handleSendMessage(c, i, a)}
                        onSendVoice={handleSendVoice}
                        isLoading={loading}
                    />
                </TabsContent>

            </Tabs>



            <DocumentRequestModal
                isOpen={docReqOpen}
                onClose={() => setDocReqOpen(false)}
                onSubmit={handleDocumentRequest}
            />

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-40 flex justify-end gap-3 items-center">

                {app.payments?.[0]?.status !== 'VERIFIED' && app.payments?.[0]?.status !== 'PAID' && (
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            // Switch to payment tab
                            const tabs = document.getElementById('app-tabs')
                            const paymentTrigger = tabs?.querySelector('[value="payment"]') as HTMLElement
                            paymentTrigger?.click()
                            toast("Please verify details in the Payment tab", { icon: '👉' })
                        }}
                    >
                        <DollarSign className="mr-2 h-4 w-4" /> Verify Payment
                    </Button>
                )}

                <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={['COMPLETED', 'DECLINED', 'REJECTED'].includes(app.status) || app.supportStatus === 'ESCALATED' || app.supportStatus === 'REJECTED'}
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" /> Escalate to Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Escalate Application</DialogTitle></DialogHeader>
                        <Textarea
                            placeholder="Reason for escalation..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                        <DialogFooter>
                            <Button onClick={handleEscalate} disabled={submitting}>Confirm</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            disabled={['COMPLETED', 'DECLINED', 'REJECTED', 'APPROVED'].includes(app.status) || app.supportStatus === 'PENDING_REJECTION' || app.supportStatus === 'REJECTED'}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Request Rejection
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Recommend Rejection</DialogTitle></DialogHeader>
                        <Textarea
                            placeholder="Reason for rejection recommendation..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                        <DialogFooter>
                            <Button variant="destructive" onClick={handleRequestRejection} disabled={submitting}>Confirm</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="ml-2">
                            <DollarSign className="mr-2 h-4 w-4" /> Assign Fee
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Assign Consultancy Fee</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fee Amount (BDT)</label>
                                <input
                                    type="number"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    placeholder="e.g. 5000"
                                    id="fee-amount-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes (Optional)</label>
                                <Textarea id="fee-notes-input" placeholder="Reason for fee assignment..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={async () => {
                                const amount = parseFloat((document.getElementById('fee-amount-input') as HTMLInputElement).value)
                                const notes = (document.getElementById('fee-notes-input') as HTMLTextAreaElement).value

                                if (!amount || amount <= 0) {
                                    toast.error("Please enter a valid amount")
                                    return
                                }

                                try {
                                    const res = await fetch(`/api/admin/support-member/applications/${params.id}/fee`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ amount, notes })
                                    })
                                    if (res.ok) {
                                        toast.success("Fee assigned successfully")
                                        fetchApp()
                                        // Close dialog - utilizing a ref would be better but simple reload works
                                        window.location.reload()
                                    } else {
                                        toast.error("Failed to assign fee")
                                    }
                                } catch {
                                    toast.error("Error assigning fee")
                                }
                            }}>Save Fee</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button
                    className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform"
                    onClick={() => setLegalConfirmOpen(true)}
                    disabled={submitting || ['COMPLETED', 'DECLINED', 'REJECTED'].includes(app.status) || app.supportStatus === 'FORWARDED_TO_LEGAL' || app.status === 'DOCUMENT_UNDER_REVIEW'}
                >
                    <CheckCircle className="mr-2 h-4 w-4" /> Forward to Legal
                </Button>
            </div>

            <AnimatedConfirmDialog
                isOpen={legalConfirmOpen}
                onClose={() => setLegalConfirmOpen(false)}
                onConfirm={handleForwardToLegal}
                title="Forward to Legal"
                description="Are you sure you want to forward this to Legal? This cannot be undone and will move the application to the next stage."
                confirmText="Forward Application"
                variant="default" // Blue/Default is fine, or arguably 'success' but legal isn't final final.
                isLoading={submitting}
            />
        </div>
    )
}
