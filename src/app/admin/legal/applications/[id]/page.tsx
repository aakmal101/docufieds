'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, XCircle, FileText, User, Calendar, CreditCard, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AnimatedConfirmDialog } from '@/components/ui/animated-confirm-dialog'

export default function LegalApplicationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [documents, setDocuments] = useState<any[]>([])
    const [decisionLoading, setDecisionLoading] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
            return
        }
        if (session?.user?.role !== 'LEGAL') {
            router.push('/dashboard')
            return
        }
        fetchApplicationDetails()
    }, [params.id, session, status])

    const fetchApplicationDetails = async () => {
        try {
            const [appRes, docsRes] = await Promise.all([
                fetch(`/api/admin/applications/${params.id}`),
                fetch(`/api/documents?applicationId=${params.id}`)
            ])

            if (appRes.ok) {
                const appData = await appRes.json()
                setApp(appData.data)
            }

            if (docsRes.ok) {
                const docsData = await docsRes.json()
                setDocuments(docsData.data || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load application details')
        } finally {
            setLoading(false)
        }
    }

    const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
        if (decision === 'REJECT' && !rejectionReason) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setDecisionLoading(true)
        try {
            const res = await fetch(`/api/admin/legal/applications/${params.id}/decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    reason: decision === 'REJECT' ? rejectionReason : undefined
                })
            })

            if (res.ok) {
                toast.success(decision === 'APPROVE' ? 'Application Approved' : 'Application Rejected')
                router.push('/admin/legal')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to process decision')
            }
        } catch (error) {
            toast.error('Error submitting decision')
        } finally {
            setDecisionLoading(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    if (!app) return <div className="p-8">Application not found</div>

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/legal">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {app.user.fullName}
                            <Badge variant="outline">{app.processType}</Badge>
                        </h1>
                        <p className="text-gray-500 text-sm">ID: {app.id}</p>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="decision">Decision</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader><CardTitle>Applicant Overview</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-500 mb-1">Contact Info</h3>
                                    <p>{app.user.email}</p>
                                    <p>{app.user.phone}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-500 mb-1">Application Info</h3>
                                    <p>Destination: {app.country}</p>
                                    <p>Submitted: {new Date(app.createdAt).toLocaleDateString()}</p>
                                    <p>Fee: {app.consultancyFee} BDT</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-500 mb-1">Current Status</h3>
                                    <Badge className="text-sm">{app.status}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader><CardTitle>Submitted Documents</CardTitle></CardHeader>
                            <CardContent>
                                {documents.length === 0 ? (
                                    <p className="text-gray-500">No documents available.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                    <div>
                                                        <p className="font-medium">{doc.documentType}</p>
                                                        <p className="text-xs text-gray-500">{doc.fileName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="decision" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Final Legal Decision</CardTitle>
                                <CardDescription>This action will finalize the application status.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                                    <h3 className="font-bold text-green-800 mb-2">Approve Application</h3>
                                    <p className="text-sm text-green-700 mb-4">
                                        Mark the application as <strong>COMPLETED</strong>. This confirms all legal requirements are met. The user will be notified of their Visa Approval.
                                    </p>
                                    <AnimatedConfirmDialog
                                        trigger={<Button className="bg-green-600 hover:bg-green-700 w-full md:w-auto">Approve & Finalize</Button>}
                                        title="Confirm Approval"
                                        description="Are you sure you want to approve this application? This action cannot be undone."
                                        onConfirm={() => handleDecision('APPROVE')}
                                    />
                                </div>

                                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                                    <h3 className="font-bold text-red-800 mb-2">Reject Application</h3>
                                    <p className="text-sm text-red-700 mb-4">
                                        Mark the application as <strong>DECLINED</strong>. Please provide a reason below.
                                    </p>
                                    <textarea
                                        className="w-full p-2 border rounded-md mb-4 text-sm"
                                        placeholder="Reason for rejection..."
                                        rows={3}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <AnimatedConfirmDialog
                                        trigger={<Button variant="destructive" className="w-full md:w-auto" disabled={!rejectionReason}>Reject Application</Button>}
                                        title="Confirm Rejection"
                                        description="Are you sure you want to reject this application?"
                                        onConfirm={() => handleDecision('REJECT')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
