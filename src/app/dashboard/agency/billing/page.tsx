'use client'

import { BillingTable } from '@/components/agency/billing/billing-table'
import { useAgencyBillingSummary } from '@/lib/hooks/use-agency-billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, AlertCircle, Calendar, CreditCard } from 'lucide-react'

export default function BillingPage() {
    const { data: summaryData } = useAgencyBillingSummary()
    const summary = summaryData?.data

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
                    <p className="text-muted-foreground mt-1">Manage your payments and download invoices.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${summary?.totalPaid?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${summary?.totalOutstanding?.toFixed(2) || '0.00'}
                        </div>
                        {summary?.overdueCount > 0 && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {summary.overdueCount} overdue invoice(s)
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${summary?.nextPaymentAmount?.toFixed(2) || '0.00'}
                        </div>
                        {summary?.nextPaymentDue ? (
                            <p className="text-xs text-muted-foreground mt-1">
                                Due {new Date(summary.nextPaymentDue).toLocaleDateString()}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">No upcoming payments</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <BillingTable />
            </div>
        </div>
    )
}
