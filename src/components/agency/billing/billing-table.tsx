'use client'

import { useState } from 'react'
import { useAgencyBilling } from '@/lib/hooks/use-agency-billing'
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
import { Download, Eye } from 'lucide-react'
import { format } from 'date-fns'

export function BillingTable() {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({}) // Add filter UI later

    const { data, isLoading } = useAgencyBilling({ ...filters, page, limit: 10 })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-500 hover:bg-green-600'
            case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600'
            case 'FAILED': return 'bg-red-500 hover:bg-red-600'
            case 'PARTIAL': return 'bg-orange-500 hover:bg-orange-600'
            default: return 'bg-gray-500'
        }
    }

    const handleDownload = async (paymentId: string) => {
        // Download invoice PDF
        window.open(`/api/agency/billing/${paymentId}/download`, '_blank')
    }

    if (isLoading) {
        return <div className="p-4 text-center">Loading billing history...</div>
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.data?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No invoices found
                            </TableCell>
                        </TableRow>
                    ) : (
                        data?.data?.map((payment: any) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                    {payment.invoiceNumber || 'Pending'}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    {payment.dueDate
                                        ? format(new Date(payment.dueDate), 'MMM dd, yyyy')
                                        : 'N/A'}
                                </TableCell>
                                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(payment.status)}>
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDownload(payment.id)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {page} of {data?.pagination?.totalPages || 1}
                </span>
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
