'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DollarSign, CheckCircle, CreditCard, Calendar, Printer } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { AnimatedConfirmDialog } from '@/components/ui/animated-confirm-dialog'

interface PaymentVerificationTabProps {
    applicationId: string
    payment: any
    onUpdate: () => void
}

export function PaymentVerificationTab({ applicationId, payment, onUpdate }: PaymentVerificationTabProps) {
    const [method, setMethod] = useState(payment?.method || 'BANK_TRANSFER')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    // Handle payment missing case gracefully
    // Handle payment missing case - Show Create Form
    if (!payment) {
        return (
            <div className="space-y-6">
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                            Record Manual Payment
                        </CardTitle>
                        <CardDescription>
                            No payment record found. You can manually record a payment received outside the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount Received</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    id="manual-amount"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select defaultValue="BDT" onValueChange={(v) => document.getElementById('manual-currency')?.setAttribute('value', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="BDT" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BDT">BDT</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" id="manual-currency" value="BDT" />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select defaultValue="CASH" onValueChange={(v) => document.getElementById('manual-method')?.setAttribute('value', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                        <SelectItem value="BKASH">bKash</SelectItem>
                                        <SelectItem value="NAGAD">Nagad</SelectItem>
                                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" id="manual-method" value="CASH" />
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction ID / Ref (Optional)</Label>
                                <Input
                                    placeholder="e.g. TRX123456"
                                    id="manual-trx"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                placeholder="Reason for manual entry..."
                                id="manual-notes"
                            />
                        </div>

                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 mt-4"
                            onClick={async () => {
                                const amount = (document.getElementById('manual-amount') as HTMLInputElement).value
                                const currency = (document.getElementById('manual-currency') as HTMLInputElement).value
                                const method = (document.getElementById('manual-method') as HTMLInputElement).value
                                const trx = (document.getElementById('manual-trx') as HTMLInputElement).value
                                const notes = (document.getElementById('manual-notes') as HTMLInputElement).value

                                if (!amount) {
                                    toast.error("Amount is required")
                                    return
                                }

                                setLoading(true)
                                try {
                                    const res = await fetch(`/api/admin/applications/${applicationId}/payment/create`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ amount, currency, method, transactionId: trx, notes })
                                    })
                                    if (res.ok) {
                                        toast.success("Payment Recorded & Verified")
                                        onUpdate()
                                    } else {
                                        toast.error("Failed to record payment")
                                    }
                                } catch { toast.error("Error performing action") }
                                finally { setLoading(false) }
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Record & Verify Payment'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const handleVerify = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/applications/${applicationId}/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethod: method,
                    notes: notes
                })
            })

            if (res.ok) {
                toast.success('Payment Verified Successfully')
                onUpdate()
                setConfirmOpen(false)
            } else {
                toast.error('Failed to verify payment')
            }
        } catch (error) {
            toast.error('Error verifying payment')
        } finally {
            setLoading(false)
        }
    }

    const isVerified = payment.status === 'VERIFIED' || payment.status === 'PAID'

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Details Card */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            Payment Details
                        </CardTitle>
                        <CardDescription>Review the transaction details before verification</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-gray-500">Amount</span>
                                <p className="font-medium text-lg text-gray-900">{payment.amount} {payment.currency}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500">Status</span>
                                <div>
                                    <Badge variant={isVerified ? 'default' : 'secondary'} className={isVerified ? 'bg-green-600' : 'bg-yellow-500'}>
                                        {payment.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500">Transaction ID</span>
                                <p className="font-medium font-mono bg-gray-50 p-1 rounded inline-block">{payment.transactionId || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500">Date</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Preview Placeholder */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border shadow-sm">
                                    <Printer className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Payment_Invoice.pdf</p>
                                    <p className="text-xs text-gray-500">System generated</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>View</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Verification Actions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Verification
                        </CardTitle>
                        <CardDescription>Confirm receipt and finalize payment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!isVerified ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                            <SelectItem value="BKASH">bKash</SelectItem>
                                            <SelectItem value="NAGAD">Nagad</SelectItem>
                                            <SelectItem value="CASH">Cash</SelectItem>
                                            <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Verification Notes (Optional)</Label>
                                    <Input
                                        placeholder="e.g. Verified with Finance Dept"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>

                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                                    onClick={() => setConfirmOpen(true)}
                                >
                                    Finalize Payment Verification
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-green-600">
                                <CheckCircle className="h-16 w-16 mb-4" />
                                <h3 className="text-xl font-bold">Payment Verified</h3>
                                <p className="text-gray-500 text-center mt-2">
                                    This payment has been confirmed and processed.
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Verified on {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Unknown'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AnimatedConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleVerify}
                title="Confirm Payment Verification"
                description={`Are you sure you want to verify this payment of ${payment.amount} ${payment.currency}? This action will update the application status.`}
                confirmText="Yes, Verify Payment"
                isLoading={loading}
            />
        </div>
    )
}
