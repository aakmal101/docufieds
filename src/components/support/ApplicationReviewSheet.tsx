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
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-gray-50/50">
                <SheetHeader className="pb-4">
                    <SheetTitle>Application Review</SheetTitle>
                    <SheetDescription>Verify details before assigning to team.</SheetDescription>
                </SheetHeader>

                {loading || !app ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col gap-6">
                        {/* Summary Card */}
                        <div className="flex items-start gap-4 bg-white p-4 rounded-lg border shadow-sm">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={app.user.photoUrl} />
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">{app.user.fullName}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        ID: {app.id.substring(0, 8)}
                                    </Badge>
                                    <Badge variant="secondary">{app.country}</Badge>
                                    <Badge variant="secondary">{app.processType}</Badge>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="documents" className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="chat">Chat & Activity</TabsTrigger>
                            </TabsList>

                            <TabsContent value="documents" className="flex-1 relative mt-4">
                                <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                                    <div className="space-y-3">
                                        {app.documents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 italic">No documents uploaded</div>
                                        ) : (
                                            app.documents.map((doc: any) => (
                                                <div key={doc.id} className="flex items-center p-3 bg-white rounded border hover:bg-gray-50 transition-colors">
                                                    <div className="bg-blue-100 p-2 rounded mr-3">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{doc.documentType}</p>
                                                        <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                                                    </div>
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600"
                                                    >
                                                        <LinkIcon className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="details" className="mt-4">
                                <div className="space-y-4 bg-white p-4 rounded-lg border">
                                    <div>
                                        <Label className="text-xs text-gray-500 uppercase">Contact Info</Label>
                                        <p className="text-sm">{app.user.email}</p>
                                        <p className="text-sm">{app.user.phone || 'N/A'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs text-gray-500 uppercase">Payment Status</Label>
                                        <div className="flex items-center mt-1">
                                            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className={`font-medium ${app.payments?.[0]?.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {app.payments?.[0]?.status || 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs text-gray-500 uppercase">Current Assignment</Label>
                                        <div className="mt-2 text-sm">
                                            {app.assignment?.member ? (
                                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-100">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-blue-200 text-blue-800">
                                                                {app.assignment.member.fullName[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-blue-900">{app.assignment.member.fullName}</p>
                                                            <p className="text-xs text-blue-600">Assigned Team Member</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="bg-white">
                                                        {app.assignment.member._count?.assignedApplications || 0} active Apps
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No Support Member assigned yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-2 h-[500px]">
                                <LeadChatTab applicationId={app.id} />
                            </TabsContent>
                        </Tabs>

                        {/* Action Area */}
                        <div className="bg-white p-4 items-center gap-2 border-t mt-auto">
                            {!showRejectForm ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => setShowRejectForm(true)}
                                    >
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Mark Incomplete
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
                                <div className="space-y-3 animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm text-red-700">Reason for rejection</h4>
                                        <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}><X className="h-4 w-4" /></Button>
                                    </div>
                                    <Textarea
                                        placeholder="e.g. Passport scan is blurry, missing back page..."
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        className="resize-none"
                                    />
                                    <Button
                                        className="w-full bg-red-600 hover:bg-red-700 text-white"
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
