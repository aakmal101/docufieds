'use client'

import { useAgencyCreditStatus } from '@/lib/hooks/use-agency-credit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Calendar } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CreditStatusCard() {
    const { data, isLoading } = useAgencyCreditStatus()

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Credit & Document Status</CardTitle></CardHeader>
                <CardContent>Loading status...</CardContent>
            </Card>
        )
    }

    const creditData = data?.data

    if (!creditData) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit & Document Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Credit Limit Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Credit Usage</span>
                        <span className="text-2xl font-bold">
                            ${creditData.outstandingAmount.toFixed(2)} / ${creditData.creditLimit.toFixed(2)}
                        </span>
                    </div>
                    <Progress
                        value={creditData.creditUsagePercent}
                        className={`h-2 ${creditData.creditUsagePercent > 80 ? 'bg-red-100' : ''}`}
                    // indicatorClassName={creditData.creditUsagePercent > 80 ? 'bg-red-500' : 'bg-primary'} 
                    // Note: Progress component might need custom styling for indicator color
                    />
                    <p className="text-sm text-muted-foreground mt-1 text-right">
                        Available: ${creditData.availableCredit.toFixed(2)}
                    </p>
                </div>

                {/* Document Limit Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Documents Used</span>
                        <span className="text-2xl font-bold">
                            {creditData.documentsUsed} / {creditData.documentLimit}
                        </span>
                    </div>
                    <Progress
                        value={creditData.documentUsagePercent}
                        className={`h-2 ${creditData.documentUsagePercent > 80 ? 'bg-yellow-100' : ''}`}
                    />
                    <p className="text-sm text-muted-foreground mt-1 text-right">
                        Remaining: {creditData.documentsRemaining}
                    </p>
                </div>

                {/* Payment Due Section */}
                {creditData.nextPaymentDue && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Next payment due in {creditData.daysUntilDue} days</span>
                    </div>
                )}

                {/* Warnings */}
                {creditData.needsAttention && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {creditData.isLocked
                                ? 'Document limit reached. Please clear dues to continue.'
                                : 'Payment due soon or credit limit nearing.'}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}
