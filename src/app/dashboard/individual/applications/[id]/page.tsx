'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SupportMessages } from '@/components/user/SupportMessages'
import { DocumentRequestCard } from '@/components/user/DocumentRequestCard'
import { Loader2, ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle, MessageSquare, History } from 'lucide-react'
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
        fetchApp() // Also refresh app to get status updates
    })

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
    if (!app) return null

    const pendingUploads = requests.filter(r => r.status === 'PENDING' || r.status === 'REJECTED')

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/individual/applications')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Applications
            </Button>

            {/* Header Status Banner */}
            <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{app.country} Visa Application</h1>
                    <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ID: {app.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>{app.processType}</span>
                        <span>•</span>
                        <span>Submitted {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Current Status</span>
                        <Badge className="text-lg px-4 py-1" variant={app.supportStatus === 'NEEDS_RESUBMISSION' ? 'destructive' : 'default'}>
                            {(app.supportStatus || app.status).replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Attention Banner if Action Required */}
            {pendingUploads.length > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-orange-800">Action Required</h3>
                        <p className="text-sm text-orange-700">You have {pendingUploads.length} document request(s) pending. Please verify via the Resubmission tab.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="status" className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-4 bg-white border h-12 p-1">
                            <TabsTrigger value="status" className="data-[state=active]:bg-gray-100">
                                <History className="mr-2 h-4 w-4" /> Status
                            </TabsTrigger>
                            <TabsTrigger value="resubmission" className="data-[state=active]:bg-gray-100 relative">
                                <FileText className="mr-2 h-4 w-4" /> Resubmit
                                {pendingUploads.length > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="messages" className="data-[state=active]:bg-gray-100">
                                <MessageSquare className="mr-2 h-4 w-4" /> Support
                            </TabsTrigger>
                            <TabsTrigger value="info" className="data-[state=active]:bg-gray-100">
                                <FileText className="mr-2 h-4 w-4" /> Details
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 bg-white border border-t-0 rounded-b-lg p-6 min-h-[500px]">
                            {/* Status Timeline Tab */}
                            <TabsContent value="status" className="mt-0 space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold">Application Timeline</h2>
                                    <Button variant="outline" size="sm" onClick={() => fetchApp()}>Refresh</Button>
                                </div>
                                <div className="space-y-8 relative pl-4 border-l-2 border-gray-100 ml-4">
                                    {/* Current Support Status Node */}
                                    <div className="relative">
                                        <div className="absolute -left-[25px] bg-blue-500 h-4 w-4 rounded-full border-4 border-white shadow-sm" />
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">Current Stage: {(app.supportStatus || app.status).replace(/_/g, ' ')}</span>
                                            {app.lastActivityAt && (
                                                <span className="text-xs text-gray-400">{new Date(app.lastActivityAt).toLocaleString()}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">Your application is currently in this stage.</p>
                                    </div>

                                    {/* History Nodes */}
                                    {app.statusUpdates?.map((update: any) => (
                                        <div key={update.id} className="relative pb-4">
                                            <div className="absolute -left-[25px] bg-gray-300 h-3 w-3 rounded-full border-2 border-white" />
                                            <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                                <span className="font-medium text-gray-700">
                                                    Status changed to <span className="font-semibold">{update.toStatus.replace(/_/g, ' ')}</span>
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(update.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            {update.notes && (
                                                <div className="text-sm bg-gray-50 p-2 rounded text-gray-600 mt-1">
                                                    "{update.notes}"
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="relative">
                                        <div className="absolute -left-[25px] bg-green-500 h-3 w-3 rounded-full border-2 border-white" />
                                        <div className="mb-1">
                                            <span className="font-medium text-gray-700">Application Submitted</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Resubmission Tab */}
                            <TabsContent value="resubmission" className="mt-0">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold">Document Requests</h2>
                                </div>
                                {requests.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-20" />
                                        <p>All documents are in order. No action required.</p>
                                    </div>
                                ) : (
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
                                )}
                            </TabsContent>

                            {/* Support Chat Tab */}
                            <TabsContent value="messages" className="mt-0 h-[600px] flex flex-col">
                                <h2 className="text-xl font-semibold mb-4">Support Team Chat</h2>
                                <div className="flex-1 border rounded-lg overflow-hidden relative">
                                    <SupportMessages applicationId={app.id} />
                                </div>
                            </TabsContent>

                            {/* Details Tab */}
                            <TabsContent value="info" className="mt-0">
                                <h2 className="text-xl font-semibold mb-6">Application Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Process</label>
                                            <p className="text-gray-900 font-medium">{app.processType}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Consultancy Fee</label>
                                            <p className="text-gray-900 font-medium">{app.consultancyFee} BDT</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Payment Status</label>
                                            <p className={`font-medium ${app.payments?.[0]?.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {app.payments?.[0]?.status || 'PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-3">Uploaded Documents</h3>
                                        <div className="space-y-2">
                                            {app.documents?.map((doc: any) => (
                                                <div key={doc.id} className="flex items-center p-2 bg-gray-50 rounded text-sm border hover:bg-gray-100 transition-colors">
                                                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                                    <span className="truncate flex-1">{doc.documentType}</span>
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Support Contact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center text-center p-4">
                                <div className="bg-blue-100 p-4 rounded-full mb-3">
                                    <MessageSquare className="h-8 w-8 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Have questions? Use the Support tab to chat directly with your assigned agent.
                                </p>
                                <Button className="w-full" variant="outline" onClick={() => {
                                    const trigger = document.querySelector('[value="messages"]') as HTMLButtonElement
                                    trigger?.click()
                                }}>
                                    Open Chat
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {/* Future actions like 'Pay Fees' or 'Download Invoice' could go here */}
                            <Button variant="ghost" className="w-full justify-start text-gray-600">
                                <FileText className="mr-2 h-4 w-4" /> View Invoice
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
