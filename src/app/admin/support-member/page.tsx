'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowRight, Search, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import ReactCountryFlag from 'react-country-flag'
import { formatDistanceToNow } from 'date-fns'
import { useApplicationAssignments } from '@/lib/supabase/realtime-support'
import { Link as LinkIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenerateLinkModal } from '@/components/support/generate-link-modal'
import { UploadSessionsList } from '@/components/support/upload-sessions-list'

const getCountryCode = (countryName: string) => {
    const map: Record<string, string> = { 'USA': 'US', 'UK': 'GB', 'Canada': 'CA', 'Australia': 'AU' }
    return map[countryName] || 'US'
}

export default function MemberDashboard() {
    const [isGenerateLinkModalOpen, setIsGenerateLinkModalOpen] = useState(false)
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [assignments, setAssignments] = useState<any[]>([])
    const [stats, setStats] = useState({ activeCount: 0, completedToday: 0, pendingResponse: 0 })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const fetchData = async () => {
        try {
            const [appsRes, statsRes] = await Promise.all([
                fetch('/api/admin/support-member/applications'),
                fetch('/api/admin/support-member/stats')
            ])

            if (appsRes.ok) {
                const data = await appsRes.json()
                setAssignments(data)
                // Extract unique users for the modal
                const users = Array.from(new Set(data.map((a: any) => a.application.userId)))
                    .map(id => data.find((a: any) => a.application.userId === id)?.application.user)
                    .filter(Boolean)
                setAllUsers(users)
            }
            if (statsRes.ok) setStats(await statsRes.json())

        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 15000)
        return () => clearInterval(interval)
    }, [])

    const filtered = assignments.filter(a => {
        const matchSearch = a.application.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
            a.application.id.includes(search)
        const matchStatus = statusFilter === 'ALL' || a.application.supportStatus === statusFilter
        return matchSearch && matchStatus
    })

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-600" /></div>

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Active</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.activeCount}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-200" />
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Completed Today</p>
                            <p className="text-2xl font-bold text-green-900">{stats.completedToday}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-200" />
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600">Pending Response</p>
                            <p className="text-2xl font-bold text-orange-900">{stats.pendingResponse}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-orange-200" />
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or ID..."
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="ASSIGNED">Assigned</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="Waiting for User">Waiting for User</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setIsGenerateLinkModalOpen(true)} className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Generate Upload Link
                </Button>
            </div>

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">My Assignments</TabsTrigger>
                    <TabsTrigger value="upload-sessions">Upload Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                            <p className="text-gray-500">No applications found.</p>
                        </div>
                    ) : (
                        filtered.map((assignment) => {
                            const app = assignment.application
                            return (
                                <Card key={assignment.id} className="hover:shadow-md transition-shadow group">
                                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`h-2 w-2 rounded-full ${assignment.priority === 'URGENT' ? 'bg-red-500' :
                                                assignment.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                                                }`} title={assignment.priority} />

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{app.user.fullName}</h3>
                                                    <span className="text-xs text-gray-400 font-mono">#{app.id.substring(0, 6)}</span>
                                                    <Badge variant="outline" className="ml-2">{app.supportStatus}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <ReactCountryFlag countryCode={getCountryCode(app.country)} svg /> {app.country}
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>{app.processType}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>{app._count.documents} Docs</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>Payment: {app.payments?.[0]?.status || 'PENDING'}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>{app.assignedAt ? formatDistanceToNow(new Date(app.assignedAt), { addSuffix: true }) : 'Recently'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Link href={`/admin/support-member/applications/${app.id}`}>
                                            <Button className="w-full md:w-auto">Process</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </TabsContent>

                <TabsContent value="upload-sessions">
                    <UploadSessionsList />
                </TabsContent>
            </Tabs>

            <GenerateLinkModal
                isOpen={isGenerateLinkModalOpen}
                onClose={() => setIsGenerateLinkModalOpen(false)}
                users={allUsers}
                applications={assignments.map(a => a.application)}
            />
        </div>
    )
}
