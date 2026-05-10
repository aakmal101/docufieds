'use client'

import { useState, useEffect } from 'react'
import { Check, X, User, FileText, CreditCard, ChevronRight, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AssignmentDropdown } from '@/components/support/AssignmentDropdown'
import toast from 'react-hot-toast'

import ReactCountryFlag from 'react-country-flag'

interface ReviewSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationId: string | null
    onStatusChange: () => void
}

export function ApplicationReviewSheet({ open, onOpenChange, applicationId, onStatusChange }: ReviewSheetProps) {
    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (open && applicationId) {
            fetchDetails()
            setShowRejectForm(false)
            setRejectionReason('')
        } else {
            setApp(null)
        }
    }, [open, applicationId])

    const fetchDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/support-lead/applications/${applicationId}`)
            if (res.ok) {
                setApp(await res.json())
            } else {
                toast.error('Failed to load application details')
                onOpenChange(false)
            }
        } catch (error) {
            toast.error('Error fetching details')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkIncomplete = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason')
            return
        }

        setProcessing(true)
        try {
            const res = await fetch(`/api/admin/support-lead/applications/${applicationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supportStatus: 'NEEDS_RESUBMISSION',
                    reason: rejectionReason
                })
            })

            if (res.ok) {
                toast.success('Marked as Incomplete')
                onStatusChange()
                onOpenChange(false)
            } else {
                toast.error('Failed to update status')
            }
        } catch (error) {
            toast.error('Action failed')
        } finally {
            setProcessing(false)
        }
    }

    if (!open) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-white p-0 border-l shadow-2xl">
                {/* Premium Header */}
                <div className="flex flex-col gap-4 p-6 bg-slate-50 border-b">
                    <div>
                        <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Application Review
                            <Badge variant="outline" className="font-mono text-xs font-normal text-slate-500 bg-white">
                                {applicationId?.substring(0, 8)}
                            </Badge>
                        </SheetTitle>
                        <SheetDescription className="text-slate-500 mt-1">
                            Review documents, verify status, and manage team assignment.
                        </SheetDescription>
                    </div>

                    {!loading && app && (
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                            <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                                <AvatarImage src={app.user.photoUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                                    <User className="h-6 w-6" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-slate-900 truncate">{app.user.individualProfile ? `${app.user.individualProfile.firstName} ${app.user.individualProfile.lastName || ''}`.trim() : 'Unknown User'}</h3>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-700">
                                        <ReactCountryFlag countryCode={app.country} svg className="text-sm" />
                                        {app.country}
                                    </div>
                                    <Badge variant="secondary" className="font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                                        {app.processType}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {loading || !app ? (
                    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Tabs defaultValue="documents" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 pt-2 border-b bg-white z-10">
                                <TabsList className="w-full justify-start h-auto p-0 bg-transparent space-x-6">
                                    <TabsTrigger
                                        value="documents"
                                        className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none hover:text-slate-700 transition-colors"
                                    >
                                        Documents
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="details"
                                        className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none hover:text-slate-700 transition-colors"
                                    >
                                        Details
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="chat"
                                        className="rounded-none border-b-2 border-transparent px-2 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none hover:text-slate-700 transition-colors"
                                    >
                                        Chat & Activity
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                                <TabsContent value="documents" className="mt-0 h-full">
                                    <div className="space-y-3">
                                        {app.documents.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">
                                                No documents uploaded
                                            </div>
                                        ) : (
                                            app.documents.map((doc: any) => (
                                                <div key={doc.id} className="group flex items-center p-4 bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-50 transition-colors">
                                                        <FileText className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-slate-900 truncate">{doc.documentType}</p>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">{doc.fileName}</p>
                                                    </div>
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                                    >
                                                        <LinkIcon className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="details" className="mt-0 space-y-6">
                                    <div className="bg-white p-5 rounded-xl border shadow-sm space-y-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Information</Label>
                                                <div className="mt-3 space-y-1">
                                                    <p className="text-sm font-medium text-slate-900">{app.user.email}</p>
                                                    <p className="text-sm text-slate-500">{app.user.phone || 'No phone number'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Status</Label>
                                            <div className="mt-3 flex items-center p-3 bg-slate-50 rounded-lg border">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${app.payments?.[0]?.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${app.payments?.[0]?.status === 'PAID' ? 'text-green-700' : 'text-orange-700'}`}>
                                                        {app.payments?.[0]?.status || 'PENDING'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {app.payments?.[0]?.amount ? `$${app.payments[0].amount.toFixed(2)}` : 'Amount pending'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Support Assignment</Label>
                                        <div className="mt-3">
                                            {app.assignment?.member ? (
                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 backdrop-blur-sm">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                            <AvatarFallback className="bg-blue-600 text-white font-medium">
                                                                {app.assignment.member.individualProfile?.firstName?.[0] || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-sm text-slate-900">{app.assignment.member.individualProfile ? `${app.assignment.member.individualProfile.firstName} ${app.assignment.member.individualProfile.lastName || ''}`.trim() : 'Unknown Member'}</p>
                                                            <p className="text-xs text-blue-600 font-medium">Assigned Member</p>
                                                        </div>
                                                        <Badge variant="outline" className="ml-auto bg-white text-blue-700 border-blue-200 shadow-sm">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs px-1">
                                                        <span className="text-slate-500">Current Workload</span>
                                                        <span className="font-semibold text-slate-900">{app.assignment.member._count?.assignedApplications || 0} applications</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-blue-100 rounded-full mt-2 overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                                        <User className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900">Unassigned</p>
                                                    <p className="text-xs text-slate-500">Assign a member to start processing</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="chat" className="mt-0 h-full flex flex-col">
                                    <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden">
                                        <LeadChatTab applicationId={app.id} />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        {/* Action Area */}
                        <div className="bg-white p-6 border-t shadow-lg ring-1 ring-black/5 z-20">
                            {!showRejectForm ? (
                                <div className="grid grid-cols-[auto_1fr] gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-11 px-6 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm font-medium transition-colors"
                                        onClick={() => setShowRejectForm(true)}
                                    >
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Incomplete
                                    </Button>

                                    <div className="w-full">
                                        <AssignmentDropdown
                                            applicationId={app.id}
                                            onAssign={() => {
                                                onStatusChange()
                                                onOpenChange(false)
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 ease-out">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm text-red-900 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Reason for Rejection
                                        </h4>
                                        <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)} className="h-8 w-8 p-0 rounded-full hover:bg-red-50 text-red-400 hover:text-red-700">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Explain what is missing or incorrect..."
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        className="resize-none min-h-[100px] border-red-100 focus:border-red-300 focus:ring-red-100 bg-red-50/30"
                                    />
                                    <Button
                                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 transition-all active:scale-[0.98]"
                                        onClick={handleMarkIncomplete}
                                        disabled={processing}
                                    >
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Incomplete Status'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

import { MessageThread, Message } from '@/components/support/MessageThread'

function LeadChatTab({ applicationId }: { applicationId: string }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetchMessages()
        // Poll for new messages every 10s or use realtime if available (polling for MVP)
        const interval = setInterval(fetchMessages, 10000)
        return () => clearInterval(interval)
    }, [applicationId])

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/admin/support-lead/applications/${applicationId}/messages`)
            if (res.ok) {
                setMessages(await res.json())
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async (content: string, isInternal: boolean, attachment?: File) => {
        setSending(true)
        try {
            const res = await fetch(`/api/admin/support-lead/applications/${applicationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isInternal })
            })
            if (res.ok) {
                const newMsg = await res.json()
                setMessages(prev => [...prev, newMsg])
            } else {
                toast.error('Failed to send message')
            }
        } catch (err) {
            toast.error('Error sending message')
        } finally {
            setSending(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>

    return (
        <MessageThread
            messages={messages}
            currentUserType="SUPPORT_MEMBER" // Lead acts as a super-member here
            onSendMessage={handleSendMessage}
            isLoading={sending}
        />
    )
}
