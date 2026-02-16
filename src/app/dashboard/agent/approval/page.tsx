'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
    Loader2,
    ShieldCheck,
    Clock,
    XCircle,
    CheckCircle,
    Send,
    AlertCircle,
    RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AgentApprovalPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [approvalData, setApprovalData] = useState<any>(null)

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        purpose: '',
    })

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/auth/signin')
            return
        }
        if (authStatus === 'authenticated' && session?.user?.role !== 'AGENT') {
            router.push('/dashboard')
            return
        }
        if (authStatus === 'authenticated') {
            fetchApprovalStatus()
        }
    }, [session, authStatus])

    const fetchApprovalStatus = async () => {
        try {
            const res = await fetch('/api/agent/approval-request')
            const data = await res.json()
            if (data.success) {
                setApprovalData(data.data)
                setForm({
                    fullName: data.data.fullName || '',
                    email: data.data.email || '',
                    phone: data.data.phone || '',
                    purpose: '',
                })
            }
        } catch (error) {
            console.error('Error fetching approval status:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!form.purpose.trim() || form.purpose.trim().length < 10) {
            toast.error('Purpose must be at least 10 characters')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/agent/approval-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purpose: form.purpose.trim(),
                    fullName: form.fullName.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Approval request submitted!')
                fetchApprovalStatus()
            } else {
                toast.error(data.message || 'Failed to submit')
            }
        } catch (error) {
            toast.error('Error submitting request')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const profileStatus = approvalData?.profileStatus

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Approval Status</h1>
                <p className="text-gray-600 mt-1">Apply for profile verification to access all features</p>
            </div>

            {/* Status Card */}
            <Card className={`mb-6 ${profileStatus === 'APPROVED' ? 'border-green-200 bg-green-50/30' :
                    profileStatus === 'PENDING_REVIEW' ? 'border-yellow-200 bg-yellow-50/30' :
                        profileStatus === 'DECLINED' ? 'border-red-200 bg-red-50/30' :
                            'border-gray-200'
                }`}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center ${profileStatus === 'APPROVED' ? 'bg-green-100' :
                                profileStatus === 'PENDING_REVIEW' ? 'bg-yellow-100' :
                                    profileStatus === 'DECLINED' ? 'bg-red-100' :
                                        'bg-gray-100'
                            }`}>
                            {profileStatus === 'APPROVED' && <CheckCircle className="h-7 w-7 text-green-600" />}
                            {profileStatus === 'PENDING_REVIEW' && <Clock className="h-7 w-7 text-yellow-600" />}
                            {profileStatus === 'DECLINED' && <XCircle className="h-7 w-7 text-red-600" />}
                            {(!profileStatus || profileStatus === 'NOT_APPLIED') && <ShieldCheck className="h-7 w-7 text-gray-400" />}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {profileStatus === 'APPROVED' && 'Profile Approved'}
                                {profileStatus === 'PENDING_REVIEW' && 'Under Review'}
                                {profileStatus === 'DECLINED' && 'Request Declined'}
                                {(!profileStatus || profileStatus === 'NOT_APPLIED') && 'Not Yet Applied'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {profileStatus === 'APPROVED' && 'Your profile has been verified. You have full access to all features.'}
                                {profileStatus === 'PENDING_REVIEW' && 'Your approval request is being reviewed by the admin team. This usually takes 1-2 business days.'}
                                {profileStatus === 'DECLINED' && 'Your request was declined. You can review the notes and resubmit.'}
                                {(!profileStatus || profileStatus === 'NOT_APPLIED') && 'Submit your details below to request profile verification.'}
                            </p>
                        </div>
                        <Badge className={`text-sm px-3 py-1 ${profileStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                profileStatus === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                    profileStatus === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-600'
                            }`}>
                            {profileStatus === 'APPROVED' ? 'Approved' :
                                profileStatus === 'PENDING_REVIEW' ? 'Pending' :
                                    profileStatus === 'DECLINED' ? 'Declined' :
                                        'Not Applied'}
                        </Badge>
                    </div>

                    {/* Show review notes if declined */}
                    {profileStatus === 'DECLINED' && approvalData?.reviewNotes && (
                        <Alert className="mt-4 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                <strong>Review Notes:</strong> {approvalData.reviewNotes.replace('[AGENT PURPOSE] ', '')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {profileStatus === 'APPROVED' && approvalData?.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-3">
                            Approved on {new Date(approvalData.reviewedAt).toLocaleDateString()}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Application Form — show if NOT approved and NOT pending */}
            {profileStatus !== 'APPROVED' && profileStatus !== 'PENDING_REVIEW' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-blue-600" />
                            {profileStatus === 'DECLINED' ? 'Resubmit Approval Request' : 'Apply for Approval'}
                        </CardTitle>
                        <CardDescription>
                            Fill in your details and explain your purpose to get verified
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={form.fullName}
                                    onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                                    placeholder="Your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Your email address"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Your phone number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose *</Label>
                            <Textarea
                                id="purpose"
                                value={form.purpose}
                                onChange={(e) => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                                placeholder="Explain your purpose for joining as an agent. What type of clients will you serve? What services do you plan to offer? (Minimum 10 characters)"
                                rows={5}
                                className="resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                {form.purpose.length}/500 characters • Minimum 10 required
                            </p>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || form.purpose.trim().length < 10}
                            className="w-full"
                            size="lg"
                        >
                            {submitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                            ) : (
                                <><Send className="mr-2 h-4 w-4" /> Submit Approval Request</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Pending state — show refresh */}
            {profileStatus === 'PENDING_REVIEW' && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Request Under Review</h3>
                        <p className="text-gray-600 mb-4">
                            Your approval request has been submitted and is being reviewed by our admin team.
                            You will be notified once a decision is made.
                        </p>
                        <Button variant="outline" onClick={fetchApprovalStatus}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Check Status
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
