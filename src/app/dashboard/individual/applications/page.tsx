'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight, FileText, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function MyApplicationsPage() {
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch('/api/applications')
                const data = await res.json()
                if (data.success) {
                    setApps(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch applications')
            } finally {
                setLoading(false)
            }
        }
        fetchApps()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700'
            case 'NEEDS_RESUBMISSION': return 'bg-red-100 text-red-700'
            case 'ASSIGNED':
            case 'PROCESSING': return 'bg-blue-100 text-blue-700'
            case 'Draft': return 'bg-gray-100 text-gray-700'
            default: return 'bg-yellow-100 text-yellow-700'
        }
    }

    if (loading) return (
        <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
                    <p className="text-gray-500 mt-1">Track and manage your visa applications.</p>
                </div>
                <Link href="/dashboard/individual/new-application">
                    <Button className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" /> New Application
                    </Button>
                </Link>
            </div>

            {apps.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent className="flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No applications yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Start your journey by creating a new visa application today.
                        </p>
                        <Link href="/dashboard/individual/new-application">
                            <Button>Start Application</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {apps.map((app) => (
                        <Card key={app.id} className="hover:shadow-md transition-shadow group">
                            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                                            {app.country} Visa
                                        </h3>
                                        <Badge variant="secondary" className={getStatusColor(app.supportStatus || app.status)}>
                                            {(app.supportStatus || app.status).replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                                        <span className="flex items-center">
                                            Reference: <span className="font-mono ml-1">{app.id.substring(0, 8)}</span>
                                        </span>
                                        <span className="flex items-center">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>• {app.processType}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                    {app.supportStatus === 'NEEDS_RESUBMISSION' && (
                                        <Badge variant="destructive" className="animate-pulse">
                                            Action Required
                                        </Badge>
                                    )}
                                    <Link href={`/dashboard/individual/applications/${app.id}`} className="w-full md:w-auto">
                                        <Button variant="outline" className="w-full group-hover:border-red-200 group-hover:text-red-600">
                                            View Status
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
