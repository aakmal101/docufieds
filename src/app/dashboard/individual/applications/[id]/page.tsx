'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SupportMessages } from '@/components/user/SupportMessages'
import { DocumentRequestCard } from '@/components/user/DocumentRequestCard'
import { Loader2, ArrowLeft, FileText, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDocumentRequests } from '@/lib/supabase/realtime-support'

export default function UserApplicationView({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [app, setApp] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch Application
    const fetchApp = async () => {
        try {
            const res = await fetch(`/api/applications/${params.id}`)
            if (res.ok) {
                setApp(await res.json())
            } else {
                toast.error('Application not found')
                router.push('/dashboard/individual')
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Fetch Pending Requests
    const fetchRequests = async () => {
        try {
            const res = await fetch(`/api/user/applications/${params.id}/document-requests`)
            if (res.ok) setRequests(await res.json())
        } catch { }
    }

    useEffect(() => {
        async function load() {
            await Promise.all([fetchApp(), fetchRequests()])
            setLoading(false)
        }
        load()
    }, [params.id])

    // Realtime listeners
    useDocumentRequests(params.id, () => {
        fetchRequests()
    })

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
    if (!app) return null

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/individual')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{app.country} Visa Application</h1>
                    <p className="text-gray-500">ID: {app.id} • Submitted on {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge className="text-lg px-4 py-1">{app.status.replace(/_/g, ' ')}</Badge>
            </div>

            {/* Pending Requests Section */}
            {requests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">Action Required</h2>
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <DocumentRequestCard
                                key={req.id}
                                request={req}
                                applicationId={app.id}
                                onResponse={fetchRequests}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500">Process Type</span>
                                <p className="font-medium">{app.processType}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Visa Fee</span>
                                <p className="font-medium">{app.consultancyFee} BDT</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="messages">
                        <TabsList>
                            <TabsTrigger value="messages">Support Chat</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>
                        <TabsContent value="messages" className="mt-4">
                            <SupportMessages applicationId={app.id} />
                        </TabsContent>
                        <TabsContent value="timeline" className="mt-4">
                            <Card>
                                <CardContent className="p-6">
                                    <p className="text-gray-500 italic">Timeline view coming soon...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {app.documents?.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center p-2 bg-gray-50 rounded text-sm">
                                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                        <span className="truncate flex-1">{doc.documentType}</span>
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
