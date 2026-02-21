'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SupportMessages } from '@/components/user/SupportMessages'
import { DocumentRequestCard } from '@/components/user/DocumentRequestCard'
import { Loader2, ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle, MessageSquare, History, Info, HelpCircle, DollarSign, Printer } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { useDocumentRequests } from '@/lib/supabase/realtime-support'

export default function UserApplicationView({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [app, setApp] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [invoiceOpen, setInvoiceOpen] = useState(false)

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
                            {app.modules?.map((mod: any) => (
                                <TabsTrigger key={mod.module} value={`module-${mod.module}`} className="data-[state=active]:bg-gray-100">
                                    {mod.module.charAt(0) + mod.module.slice(1).toLowerCase()}
                                </TabsTrigger>
                            ))}
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
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-900 font-medium">{app.consultancyFee} BDT</p>
                                                {app.supportFeeDescription && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                                    <Info className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-[200px] text-xs">{app.supportFeeDescription}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Payment Status</label>
                                            <p className={`font-medium ${app.payments?.[0]?.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {app.payments?.[0]?.status || 'PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-3">General Documents</h3>
                                        <div className="space-y-2">
                                            {app.documents?.filter((d: any) => !d.module).map((doc: any) => (
                                                <div key={doc.id} className="flex items-center p-2 bg-gray-50 rounded text-sm border hover:bg-gray-100 transition-colors">
                                                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                                    <span className="truncate flex-1">{doc.documentType}</span>
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                </div>
                                            ))}
                                            {(!app.documents || app.documents.filter((d: any) => !d.module).length === 0) && (
                                                <p className="text-sm text-gray-400 italic">No general documents uploaded.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Dynamic Module Tabs */}
                            {app.modules?.map((mod: any) => (
                                <TabsContent key={mod.module} value={`module-${mod.module}`} className="mt-0">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold">{mod.module.charAt(0) + mod.module.slice(1).toLowerCase()} Module</h2>
                                        <Badge variant={mod.status === 'COMPLETE' ? 'default' : 'secondary'}>
                                            {mod.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Module Documents */}
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Module Documents
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {app.documents?.filter((d: any) => d.module === mod.module).map((doc: any) => (
                                                    <div key={doc.id} className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
                                                        <FileText className="h-5 w-5 text-blue-500 mr-3" />
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium text-sm truncate">{doc.documentType}</p>
                                                            <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                                                        </div>
                                                        <CheckCircle className="h-5 w-5 text-green-500 ml-auto flex-shrink-0" />
                                                    </div>
                                                ))}
                                                {(!app.documents || app.documents.filter((d: any) => d.module === mod.module).length === 0) && (
                                                    <div className="col-span-full text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                                                        <p className="text-sm text-gray-500">No documents uploaded for this module.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Module specific info could go here */}
                                        {/* For now just a placeholder */}
                                        <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">
                                            Additional information for {mod.module.toLowerCase()} will appear here.
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
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
                                <Button className="w-full" variant="outline" onClick={() => router.push(`/dashboard/individual/applications/${app.id}/chat`)}>
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
                            <Button variant="outline" className="w-full justify-start" onClick={() => setInvoiceOpen(true)}>
                                <FileText className="mr-2 h-4 w-4" /> View Invoice
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Application Invoice</DialogTitle>
                        <DialogDescription>Summary of fees and payment status</DialogDescription>
                    </DialogHeader>

                    <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
                        <div className="flex justify-between items-start border-b pb-6">
                            <div>
                                <h3 className="font-bold text-xl text-blue-600">Docufieds</h3>
                                <p className="text-sm text-gray-500">Service Fee Invoice</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-xs text-gray-400">#INV-{app.id.substring(0, 8).toUpperCase()}</p>
                                <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Billed To</p>
                                <p className="font-bold">{app.user.fullName}</p>
                                <p className="text-gray-600">{app.user.email}</p>
                                <p className="text-gray-600">{app.user.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Application</p>
                                <p className="font-bold">{app.country} Visa</p>
                                <p className="text-gray-600">{app.processType}</p>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-bold">Description</th>
                                        <th className="text-right px-4 py-3 font-bold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-4">
                                            <p className="font-medium">Visa Consultation & Processing Fee</p>
                                            {app.supportFeeDescription && (
                                                <p className="text-xs text-gray-500 mt-1 italic">Note: {app.supportFeeDescription}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium">{app.consultancyFee?.toLocaleString()} BDT</td>
                                    </tr>
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold border-t">
                                    <tr>
                                        <td className="px-4 py-4 uppercase tracking-wider text-xs">Total Amount</td>
                                        <td className="px-4 py-4 text-right text-lg text-blue-600">
                                            {app.consultancyFee?.toLocaleString()} BDT
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <div className="flex items-center gap-2">
                                <Badge variant={app.payments?.[0]?.status === 'PAID' || app.payments?.[0]?.status === 'VERIFIED' ? 'default' : 'secondary'} className="px-4 py-1">
                                    {app.payments?.[0]?.status || 'UNPAID'}
                                </Badge>
                                <span className="text-xs text-gray-400">Payment Status</span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-400" disabled>
                                <Printer className="h-4 w-4 mr-2" /> Print PDF (Coming Soon)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
