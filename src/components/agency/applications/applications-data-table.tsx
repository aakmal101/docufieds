'use client'

import { useState } from 'react'
import { useAgencyApplications } from '@/lib/hooks/use-agency-applications'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Download, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

export function ApplicationsDataTable() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<string>('all')
    const [country, setCountry] = useState<string>('all')

    const { data, isLoading } = useAgencyApplications({
        page,
        limit: 10,
        search,
        status: status === 'all' ? undefined : status,
        country: country === 'all' ? undefined : country,
    })

    // Debounce search could be added here

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-500'
            case 'PROCESSED': return 'bg-blue-500'
            case 'UNDER_REVIEW': return 'bg-yellow-500'
            case 'DECLINED': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    if (isLoading) {
        return <div>Loading applications...</div>
    }

    return (
        <div className="space-y-4">
            {/* Filters Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-lg border">
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID or Member ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                            <SelectItem value="PROCESSED">Processed</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="DECLINED">Declined</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {/* Ideally populate this from API */}
                            <SelectItem value="USA">USA</SelectItem>
                            <SelectItem value="UK">UK</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Dubai">Dubai</SelectItem>
                            <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Application ID</TableHead>
                            <TableHead>Client / Member</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No applications found matching your criteria
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.map((app: any) => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium text-xs font-mono">
                                        {app.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        {app.memberId || 'N/A'}
                                    </TableCell>
                                    <TableCell>{app.country}</TableCell>
                                    <TableCell className="text-xs">{app.processType}</TableCell>
                                    <TableCell className="text-xs">
                                        {format(new Date(app.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(app.status)}>
                                            {app.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {app.documents?.length || 0} uploaded
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                    Page {page} of {data?.pagination?.totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    disabled={!data?.pagination || page === data?.pagination?.totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
