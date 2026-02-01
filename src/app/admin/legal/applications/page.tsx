'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { LegalReviewSheet } from '@/components/legal/LegalReviewSheet'

export default function LegalApplicationsPage() {
    const [activeTab, setActiveTab] = useState('ALL')
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [reviewAppId, setReviewAppId] = useState<string | null>(null)

    const fetchApps = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                status: activeTab,
            })
            const res = await fetch(`/api/admin/legal/applications?${params}`)
            if (res.ok) {
                const data = await res.json()
                setApps(data.applications || [])
                setTotalPages(data.pages || 1)
            } else {
                toast.error('Failed to load applications')
            }
        } catch (error) {
            toast.error('Error loading data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1)
    }, [activeTab, search])

    useEffect(() => {
        fetchApps()
    }, [page, activeTab, search]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Legal Applications</h1>
                    <p className="text-gray-500">Manage applications awaiting final legal review.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="ALL">All</TabsTrigger>
                                <TabsTrigger value="PENDING">Pending Review</TabsTrigger>
                                <TabsTrigger value="COMPLETED">Ready to Deliver</TabsTrigger>
                                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search Applicant..."
                                className="pl-8"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : apps.length === 0 ? (
                        <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            No applications found.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Country/Type</TableHead>
                                        <TableHead>Received At</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apps.map((app) => (
                                        <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setReviewAppId(app.id)}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{app.user.fullName}</span>
                                                    <span className="text-xs text-gray-500">{app.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{app.country}</span>
                                                    <Badge variant="outline" className="text-[10px]">{app.processType}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {app.forwardedToLegalAt ? new Date(app.forwardedToLegalAt).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    app.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                        ['DECLINED', 'REJECTED'].includes(app.status) ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                                            'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                                }>
                                                    {app.status === 'COMPLETED' ? 'Ready to Deliver' : app.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setReviewAppId(app.id) }}>
                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                        <Button
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Application Review Sheet Component */}
            <LegalReviewSheet
                open={!!reviewAppId}
                onOpenChange={(open) => !open && setReviewAppId(null)}
                applicationId={reviewAppId}
                onStatusChange={() => { setReviewAppId(null); fetchApps(); }}
            />
        </div>
    )
}
