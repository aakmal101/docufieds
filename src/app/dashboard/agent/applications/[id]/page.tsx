
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, FileText, Upload, MessageSquare, DollarSign, Link2, Clock } from 'lucide-react'
import { MessageThread } from '@/components/support/MessageThread'
import toast from 'react-hot-toast'

export default function AgentApplicationDetail() {
    const params = useParams()
    const router = useRouter()
    const [application, setApplication] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchApplication()
        }
    }, [params.id])

    const fetchApplication = async () => {
        try {
            const res = await fetch(`/api/agent/applications/${params.id}`)
            if (!res.ok) {
                if (res.status === 403) toast.error('Access Denied: You are not assigned to this application')
                if (res.status === 401) toast.error('Please sign in')
                throw new Error('Failed')
            }
            const data = await res.json()
            if (data.success) {
                setApplication(data.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async (content: string, isInternal: boolean, attachment?: File) => {
        setSending(true)
        try {
            const res = await fetch('/api/agent/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicationId: application.id,
                    content,
                    messageType: 'TEXT'
                })
            })

            if (res.ok) {
                toast.success('Message sent')
                fetchApplication()
            } else {
                throw new Error('Failed to send')
            }
        } catch (error) {
            toast.error('Error sending message')
        } finally {
            setSending(false)
        }
    }

    const getUploadSessionStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800'
            case 'EXPIRED': return 'bg-red-100 text-red-800'
            case 'CANCELLED': return 'bg-gray-100 text-gray-800'
            default: return 'bg-blue-100 text-blue-800'
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
    if (!application) return <div className="p-8">Application not found or access denied.</div>

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/agent')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{application.user?.fullName}</h1>
                    <p className="text-gray-500">{application.country} • {application.processType}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="text-base px-3 py-1">{application.status}</Badge>
                </div>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="uploads">Uploads</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Support Fee - Read Only */}
                    {(application.supportFeeAmount !== null && application.supportFeeAmount !== undefined) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Support Fee
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">Support Fee Amount</span>
                                    <span className="text-xl font-bold text-green-700">
                                        {application.supportFeeAmount} {application.supportFeeCurrency || 'BDT'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">This fee is set by the support team and is read-only.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Modules */}
                    <Card>
                        <CardHeader><CardTitle>Modules</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                {application.modules?.length > 0 ? (
                                    application.modules.map((m: any) => (
                                        <div key={m.module} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                                            <span className="font-medium">{m.module}</span>
                                            <Badge variant="outline">{m.status}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">No modules assigned.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Application Info */}
                    <Card>
                        <CardHeader><CardTitle>Application Details</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Country</p>
                                    <p className="font-medium">{application.country}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Process Type</p>
                                    <p className="font-medium">{application.processType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Profession</p>
                                    <p className="font-medium">{application.profession || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Consultancy Fee</p>
                                    <p className="font-medium">{application.consultancyFee} BDT</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Member ID</p>
                                    <p className="font-medium">{application.memberId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Created</p>
                                    <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {application.documents?.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No documents.</p>
                                ) : (
                                    application.documents?.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <p className="font-medium text-sm">{doc.fileName}</p>
                                                    <p className="text-xs text-gray-500">{doc.documentType} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{doc.status}</Badge>
                                                {doc.isRequired && (
                                                    <Badge variant="outline" className="text-xs">Required</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="uploads" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5" />
                                Upload Sessions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!application.uploadSessions || application.uploadSessions.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No upload sessions.</p>
                            ) : (
                                <div className="space-y-4">
                                    {application.uploadSessions.map((session: any) => (
                                        <div key={session.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getUploadSessionStatusColor(session.status)}>
                                                            {session.status}
                                                        </Badge>
                                                        <span className="text-sm text-gray-500">
                                                            {session.slotCount} slot{session.slotCount !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {session.createdByUser?.fullName && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Created by {session.createdByUser.fullName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Expires: {new Date(session.expiresAt).toLocaleString()}
                                                    </div>
                                                    <div>Created: {new Date(session.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            {/* Slots */}
                                            <div className="grid gap-2">
                                                {session.slots?.map((slot: any) => (
                                                    <div key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                        <span className="font-medium">{slot.label || `Slot ${slot.slotIndex + 1}`}</span>
                                                        <div className="flex items-center gap-2">
                                                            {slot.uploadedDocument ? (
                                                                <>
                                                                    <FileText className="h-4 w-4 text-green-500" />
                                                                    <span className="text-green-700">{slot.uploadedDocument.fileName}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400">Not uploaded</span>
                                                            )}
                                                            <Badge variant="outline" className="text-xs">{slot.status}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages">
                    <MessageThread
                        messages={application.supportMessages || []}
                        currentUserType="SUPPORT_MEMBER"
                        onSendMessage={handleSendMessage}
                        isLoading={sending}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
