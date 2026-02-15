'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle, ArrowLeft, User, MapPin, FileText, RotateCcw, ScrollText } from 'lucide-react'
import { VerifiedBadge } from '@/components/user/VerifiedBadge'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UserReviewDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionNote, setActionNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${params.id}/review`)
                if (res.ok) {
                    setUser(await res.json())
                } else {
                    toast.error('Failed to load user')
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [params.id])

    const handleAction = async (action: 'APPROVE' | 'DECLINE' | 'RESET') => {
        if (action === 'DECLINE' && (!actionNote || actionNote.length < 3)) {
            toast.error('Please provide a reason for declining.')
            return
        }
        if (!confirm(`Are you sure you want to ${action === 'RESET' ? 'Reset' : action === 'APPROVE' ? 'Approve' : 'Decline'} this user?`)) return

        setIsSubmitting(true)
        try {
            let endpoint = `/api/admin/users/${params.id}/approve`
            if (action === 'DECLINE') endpoint = `/api/admin/users/${params.id}/decline`
            if (action === 'RESET') endpoint = `/api/admin/users/${params.id}/reset-to-pending`

            const body = action === 'APPROVE' || action === 'RESET' ? { notes: actionNote } : { reason: actionNote }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(`Action successful`)
                router.push('/admin/users/reviews')
                router.refresh()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Action failed')
            }
        } catch (error) {
            toast.error('Network error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
    if (!user) return <div className="p-20 text-center">User not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <Button variant="ghost" asChild className="pl-0">
                <Link href="/admin/users/reviews"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue</Link>
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {user.fullName}
                        <VerifiedBadge status={user.profileStatus} />
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge className={
                            user.profileStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                user.profileStatus === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                        }>{user.profileStatus.replace('_', ' ')}</Badge>
                    </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                    <p>ID: {user.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Personal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium">{user.email}</span>

                            <span className="text-gray-500">Phone:</span>
                            <span className="font-medium">{user.phone || 'N/A'}</span>

                            <span className="text-gray-500">Date of Birth:</span>
                            <span className="font-medium">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}</span>

                            <span className="text-gray-500">Nationality:</span>
                            <span className="font-medium">{user.nationality || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <span className="block text-gray-500 text-xs">Present Address</span>
                            <p>{user.presentAddress || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs">Permanent Address</span>
                            <p>{user.permanentAddress || 'N/A'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents / Identity Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Identity Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded border">
                            <span className="block text-xs text-gray-500">Passport Number</span>
                            <p className="font-mono font-bold mt-1">{user.passportNumber || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                            <span className="block text-xs text-gray-500">NID Number</span>
                            <p className="font-mono font-bold mt-1">{user.nidNumber || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                            <span className="block text-xs text-gray-500">Birth Certificate</span>
                            <p className="font-mono font-bold mt-1">{user.birthCertificateNumber || 'N/A'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Panel */}
            <Card className="border-t-4 border-t-indigo-500">
                <CardHeader>
                    <CardTitle>Review Action</CardTitle>
                    <CardDescription>Make a final decision on this user profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="note">Notes / Rejection Reason</Label>
                        <Textarea
                            id="note"
                            placeholder="Enter notes (mandatory for rejection)..."
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction('APPROVE')}
                            disabled={isSubmitting || user.profileStatus === 'APPROVED'}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve Profile
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleAction('DECLINE')}
                            disabled={isSubmitting || user.profileStatus === 'DECLINED'}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Decline Profile
                        </Button>
                    </div>

                    {user.profileStatus !== 'PENDING_REVIEW' && (
                        <div className="pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                className="w-full border-dashed"
                                onClick={() => handleAction('RESET')}
                                disabled={isSubmitting}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset to Pending
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audit Trail */}
            {user.targetAuditLogs && user.targetAuditLogs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Audit Trail</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {user.targetAuditLogs.map((log: any) => (
                                <div key={log.id} className="flex gap-4 p-3 bg-gray-50 rounded border text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                                        <p className="text-gray-500 text-xs">
                                            By {log.actor?.fullName} ({log.actor?.email})
                                        </p>
                                        {log.metadata && (
                                            <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

