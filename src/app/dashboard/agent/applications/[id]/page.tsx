
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, FileText, Upload, MessageSquare } from 'lucide-react'
import { MessageThread } from '@/components/support/MessageThread'
import toast from 'react-hot-toast'

export default function AgentApplicationDetail() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    // const { toast } = useToast() // Removed
    const [application, setApplication] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (session?.user?.id && params.id) {
            fetchApplication()
        }
    }, [session, params.id])

    const fetchApplication = async () => {
        try {
            const res = await fetch(`/api/agent/applications/${params.id}`, {
                headers: { 'x-user-id': session?.user?.id || '' }
            })
            if (!res.ok) {
                if (res.status === 403) toast.error('Access Denied: You are not assigned to this application')
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
            // We need an endpoint for this. 
            // For now, let's mock it or assume we create it.
            // POST /api/agent/messages
            const res = await fetch('/api/agent/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session?.user?.id || ''
                },
                body: JSON.stringify({
                    applicationId: application.id,
                    content,
                    messageType: 'TEXT'
                })
            })

            if (res.ok) {
                toast.success('Message sent')
                fetchApplication() // Refresh
            } else {
                throw new Error('Failed to send')
            }
        } catch (error) {
            toast.error('Error sending message')
        } finally {
            setSending(false)
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
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Modules</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                {application.modules?.map((m: any) => (
                                    <div key={m.module} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                                        <span className="font-medium">{m.module}</span>
                                        <Badge variant="outline">{m.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Documents</CardTitle>
                            {/* Actions like Request Doc could go here */}
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
                                            <Badge variant="secondary">{doc.status}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages">
                    <MessageThread
                        messages={application.supportMessages || []}
                        currentUserType="SUPPORT_MEMBER" // Reusing Support Member persona for Agent? Or USER?
                        // Support Member view allows internal notes. Agents probably act like Support Members in this context.
                        onSendMessage={handleSendMessage}
                        isLoading={sending}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
