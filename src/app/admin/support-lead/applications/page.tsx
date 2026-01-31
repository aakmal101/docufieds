'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ApplicationReviewSheet } from '@/components/support/ApplicationReviewSheet'
import { Loader2, Search, Filter, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactCountryFlag from 'react-country-flag'

const STATUS_TABS = [
    { value: 'ALL', label: 'All Applications' },
    { value: 'PENDING', label: 'Pending Assignment' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'ESCALATED', label: 'Escalated' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'REJECTED', label: 'Rejected' },
]

export default function AllApplicationsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize tab from URL param 'status' or default to ALL
    const initialStatus = searchParams.get('status') || 'ALL'

    const [activeTab, setActiveTab] = useState(initialStatus)
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
                status: activeTab, // Filter by active tab
            })
            const res = await fetch(`/api/admin/support-lead/applications?${params}`)
            const data = await res.json()
            if (res.ok) {
                setApps(data.applications || []) // Ensure array
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
        // Reset page when tab changes
        setPage(1)
    }, [activeTab])

    useEffect(() => {
        fetchApps()
    }, [page, search, activeTab])

    const handleView = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setReviewAppId(id)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
                    <p className="text-gray-500">Manage and oversee all visa applications in the system.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="ALL">All</TabsTrigger>
                                {STATUS_TABS.filter(t => t.value !== 'ALL').map(tab => (
                                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search ID, Name, Email..."
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
                            No applications found for this filter.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Country/Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apps.map((app) => (
                                        <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleView(app.id)}>
                                            <TableCell className="font-mono text-xs">{app.id.substring(0, 8)}</TableCell>
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
                                            <TableCell>
                                                <Badge className={
                                                    app.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                        app.status === 'DECLINED' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                                            'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                                }>
                                                    {app.status === 'DOCUMENT_UNDER_REVIEW' ? 'Under Review' : app.status}
                                                </Badge>
                                                {app.supportStatus && app.status !== 'COMPLETED' && (
                                                    <div className="text-xs text-gray-500 mt-1">{app.supportStatus.replace('_', ' ')}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {/* Corrected Access: assignment is object, member has fullName */}
                                                {app.assignment?.member?.fullName || <span className="text-gray-400 italic">Unassigned</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {app.payments?.[0]?.status || 'UNPAID'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={(e) => handleView(app.id, e)}>
                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Simple Pagination */}
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

            <ApplicationReviewSheet
                open={!!reviewAppId}
                onOpenChange={(open) => !open && setReviewAppId(null)}
                applicationId={reviewAppId}
                onStatusChange={() => {
                    setReviewAppId(null)
                    fetchApps()
                }}
            />
        </div>
    )
}
