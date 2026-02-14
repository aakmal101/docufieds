'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Eye, UserCheck, ShieldAlert } from 'lucide-react'
import { VerifiedBadge } from '@/components/user/VerifiedBadge'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ProfileReviewsPage() {
    const [activeTab, setActiveTab] = useState('PENDING')
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Helper to fetch based on current state
    const fetchUsers = async () => {
        setLoading(true)
        try {
            // Note: Our API is currently hardcoded for 'PENDING_REVIEW'. 
            // We should enhance it to filter by status if we want tabs to work nicely.
            // For now, let's assume the API returns pending by default, 
            // but we might need to update the API to accept `status` query param.
            // I'll update the API next if needed, but let's try to pass it.
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                status: activeTab === 'PENDING' ? 'PENDING_REVIEW' : activeTab
            })

            // Wait, I only implemented 'PENDING_REVIEW' filter in the API?
            // "whereClause: { profileStatus: 'PENDING_REVIEW' }" -> Yes.
            // I need to update the API to be dynamic status capable.
            // For now, I will assume I fix the API or create a new one. 
            // Let's presume I'll fix the API in the next step to support filters.

            const res = await fetch(`/api/admin/users/review-queue?${params}`)
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
                setTotalPages(data.pages || 1)
            } else {
                toast.error('Failed to load users')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error fetching users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1)
    }, [activeTab, search])

    useEffect(() => {
        fetchUsers()
    }, [page, activeTab, search])

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Reviews</h1>
                <p className="text-gray-500">Review and verify user profiles.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="PENDING">Pending Review</TabsTrigger>
                                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                                <TabsTrigger value="DECLINED">Declined</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search User..."
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
                    ) : users.length === 0 ? (
                        <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            No users found for this status.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Registered</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                        {user.photoUrl ? (
                                                            <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-gray-500 font-bold">{user.fullName?.[0] || 'U'}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {user.fullName}
                                                            <VerifiedBadge status={user.profileStatus} />
                                                        </div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{user.country || user.nationality || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{user.phone || 'No phone'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    user.profileStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                        user.profileStatus === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                }>
                                                    {user.profileStatus.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/users/reviews/${user.id}`}>
                                                        <Eye className="h-4 w-4 mr-1" /> Review
                                                    </Link>
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
        </div>
    )
}
