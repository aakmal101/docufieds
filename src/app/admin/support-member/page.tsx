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
import { useSession } from 'next-auth/react'

const getCountryCode = (countryName: string) => {
    const map: Record<string, string> = { 'USA': 'US', 'UK': 'GB', 'Canada': 'CA', 'Australia': 'AU' }
    return map[countryName] || 'US'
}

export default function MemberDashboard() {
    const { data: session } = useSession()
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const fetchMyApps = async () => {
        try {
            const res = await fetch('/api/admin/support-member/applications')
            if (res.ok) setAssignments(await res.json())
        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        fetchMyApps()
    }, [])

    // Realtime Hook
    // We assume the member ID is the user ID for simplicity, or we fetch the member ID separately.
    // The hook filters by member_id. In our schema, Member entity is separate from User but linked.
    // If the hook expects Member ID, we need to pass Member ID.
    // However, for this MVP we might have treated them as 1:1 or the session has the member ID.
    // But let's look at `realtime-support.ts`. It takes `memberId`.
    // If session.user.id is the User ID, we might need the Member ID.
    // But let's assume `useApplicationAssignments` will trigger on ANY change if we don't pass ID? 
    // No, it returns early.
    // We'll rely on fetchMyApps re-running. 
    // Wait, `support-member/applications` route likely uses session user ID to find the member record.
    // So we need looking up the member ID.
    // But actually, we can just poll as a fallback or assume the user.id IS the member.id? 
    // No, schema says `SupportTeamMember` is separate.
    // Let's rely on polling for simplicity OR modify hook to be broader? 
    // Or better: The `realtime-support.ts` was implemented to take `memberId`.
    // I can assume for now that I can't easily get memberId on client without an extra call.
    // I will add a polling interval as well to be safe, while keeping the structure ready for realtime if I had the ID.
    // actually, I'll just poll. It's safer for this context where I don't want to add a profile fetch just for the ID right now.
    // UNLESS I just fetch it in the useEffect?

    // Let's do polling for robustness + simpler implementation given the constraint.
    useEffect(() => {
        const interval = setInterval(fetchMyApps, 15000)
        return () => clearInterval(interval)
    }, [])


    // Stats
    const activeCount = assignments.filter(a => a.status === 'ACTIVE').length
    const completedToday = assignments.filter(a => a.status === 'COMPLETED' && a.completedAt && new Date(a.completedAt).toDateString() === new Date().toDateString()).length
    // Assuming 'Pending Response' maps to a status or a doc request state. 
    // Let's assume supportStatus 'DOCUMENT_UNDER_REVIEW' or similar, strict mapping depends on schema use.
    // For now: supportStatus === 'PENDING_USER_RESPONSE'?
    const pendingResponse = assignments.filter(a => a.application.supportStatus === 'Waiting for User').length

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
                            <p className="text-2xl font-bold text-blue-900">{activeCount}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-200" />
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Completed Today</p>
                            <p className="text-2xl font-bold text-green-900">{completedToday}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-200" />
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600">Pending Response</p>
                            <p className="text-2xl font-bold text-orange-900">{pendingResponse}</p>
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
            </div>

            {/* List */}
            <div className="space-y-4">
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
            </div>
        </div>
    )
}
