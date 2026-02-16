'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    FileText,
    CreditCard,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    Briefcase
} from 'lucide-react'

export default function AgentDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
            return
        }

        if (status === 'authenticated' && session?.user?.role !== 'AGENT') {
            router.push('/dashboard')
            return
        }

        if (status === 'authenticated') {
            fetchDashboardData()
        }
    }, [session, status, router])

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/agent/assignments')
            const data = await res.json()

            if (data.success) {
                setStats(data.data.stats)
                setAssignments(data.data.assignments)
            }
        } catch (error) {
            console.error('Error fetching agent dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const getApplicationStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800'
            case 'PROCESSED':
                return 'bg-red-100 text-red-800'
            case 'DOCUMENT_UNDER_PROCESSING':
                return 'bg-purple-100 text-purple-800'
            case 'DOCUMENT_UNDER_REVIEW':
                return 'bg-yellow-100 text-yellow-800'
            case 'UNDER_REVIEW':
                return 'bg-orange-100 text-orange-800'
            case 'DECLINED':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // Build applications list from assignments
    const applications = assignments
        .filter((a: any) => a.application)
        .map((a: any) => a.application)

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {session?.user?.name || 'Agent'}!
                    </h1>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1">
                        <Briefcase className="h-3 w-3" />
                        Agent
                    </Badge>
                </div>
                <p className="text-gray-600">
                    Manage your assigned visa applications and track your work
                </p>
            </div>

            {/* Quick Stats - 4 column grid matching agency */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-red-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                                <p className="text-sm text-gray-600">Total Applications</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
                                <p className="text-sm text-gray-600">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{stats?.inProgress || 0}</p>
                                <p className="text-sm text-gray-600">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <AlertCircle className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{stats?.pendingReview || 0}</p>
                                <p className="text-sm text-gray-600">Pending Review</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats - 2 column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-indigo-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                                <p className="text-sm text-gray-600">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-amber-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold text-gray-900">{stats?.pendingDocuments || 0}</p>
                                <p className="text-sm text-gray-600">Pending Documents</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Assigned Applications</CardTitle>
                            <CardDescription>Manage and track your assigned visa applications</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={() => router.push('/dashboard/agent/new-application')}>
                                New Application
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {applications.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                            <p className="text-gray-600 mb-4">Start processing visa applications for your clients</p>
                            <Button onClick={() => router.push('/dashboard/agent/new-application')}>
                                Create First Application
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((application: any) => (
                                <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {application.country} - {application.processType}
                                                </h3>
                                                <Badge className={getApplicationStatusColor(application.status)}>
                                                    {application.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {new Date(application.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center">
                                                    <CreditCard className="h-4 w-4 mr-1" />
                                                    {application.consultancyFee} BDT
                                                </div>
                                                {application.user?.fullName && (
                                                    <div className="flex items-center">
                                                        <Users className="h-4 w-4 mr-1" />
                                                        {application.user.fullName}
                                                    </div>
                                                )}
                                                {application.memberId && (
                                                    <div className="flex items-center text-gray-500">
                                                        ID: {application.memberId}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/agent/applications/${application.id}`)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
