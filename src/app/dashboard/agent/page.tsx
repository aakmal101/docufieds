
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Assignment {
    id: string
    status: string
    targetUser?: {
        id: string
        fullName: string
        email: string
    } | null
    application?: {
        id: string
        status: string
        processType: string
        country: string
        modules: { module: string, status: string }[]
    } | null
}

export default function AgentDashboard() {
    const { data: session } = useSession()
    const router = useRouter()
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.id) {
            fetchAssignments()
        }
    }, [session])

    const fetchAssignments = async () => {
        try {
            const res = await fetch('/api/agent/assignments', {
                headers: {
                    'x-user-id': session?.user?.id || '' // In real app, cookie/session handles this, but API might expect header for test parity or we fix API to use session
                }
            })
            if (!res.ok) throw new Error('Failed to fetch assignments')
            const data = await res.json()
            if (data.success) {
                setAssignments(data.data)
            }
        } catch (error) {
            console.error(error)
            // Silent fail or toast
        } finally {
            setLoading(false)
        }
    }

    const stats = {
        total: assignments.length,
        active: assignments.filter(a => a.status === 'ACTIVE').length,
        pending_review: assignments.filter(a => a.application?.status === 'SUBMITTED').length // Logic depends on status
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-2">
                    Welcome back, {session?.user?.name}. Here are your assigned tasks.
                </p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Applications</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Active assignments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_review}</div>
                        <p className="text-xs text-muted-foreground">Applications waiting for action</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {/* Estimate distinct users */}
                        <div className="text-2xl font-bold">{new Set(assignments.map(a => a.targetUser?.id).filter(Boolean)).size}</div>
                        <p className="text-xs text-muted-foreground">Unique clients assigned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>My Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    {assignments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No applications assigned yet.</p>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Client</th>
                                        <th className="px-6 py-3">Application</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Modules</th>
                                        <th className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((assignment) => (
                                        <tr key={assignment.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {assignment.targetUser?.fullName || 'Unknown User'}
                                                <div className="text-xs text-gray-500 font-normal">{assignment.targetUser?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignment.application ? (
                                                    <div>
                                                        <div className="font-medium">{assignment.application.country} - {assignment.application.processType}</div>
                                                        <div className="text-xs text-gray-500">{new Date(assignment.application.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 font-normal italic">User Only Assignment</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignment.application ? (
                                                    <Badge variant={assignment.application.status === 'DRAFT' ? 'outline' : 'default'} className={
                                                        assignment.application.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                                                            assignment.application.status === 'APPROVED' ? 'bg-green-100 text-green-800' : ''
                                                    }>
                                                        {assignment.application.status}
                                                    </Badge>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignment.application?.modules.length ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {assignment.application.modules.map(m => (
                                                            <Badge key={m.module} variant="secondary" className="text-[10px]">
                                                                {m.module}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignment.application && (
                                                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 p-0 hover:bg-transparent font-medium" onClick={() => router.push(`/dashboard/agent/applications/${assignment.application!.id}`)}>
                                                        View Details <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
