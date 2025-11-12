'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { PaymentMethod } from '@/types'
import toast from 'react-hot-toast'

interface PaymentGatewayProps {
  applicationId: string
  amount: number
  onPaymentSuccess?: (paymentId: string) => void
  onPaymentError?: (error: string) => void
}

const paymentMethods = [
  {
    id: PaymentMethod.ONLINE,
    name: 'Online Payment',
    description: 'Credit/Debit Card, Net Banking',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: PaymentMethod.MFS,
    name: 'Mobile Financial Services',
    description: 'bKash, Rocket, Nagad',
    icon: <Smartphone className="h-6 w-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: PaymentMethod.CASH,
    name: 'Cash Payment',
    description: 'Pay at office location',
    icon: <Banknote className="h-6 w-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
]

export default function PaymentGateway({ 
  applicationId, 
  amount, 
  onPaymentSuccess,
  onPaymentError 
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method')
      return
    }

    setProcessing(true)
    setPaymentStatus('processing')

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          amount,
          method: selectedMethod,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (selectedMethod === PaymentMethod.ONLINE) {
          // Redirect to payment gateway
          window.location.href = data.paymentUrl
        } else if (selectedMethod === PaymentMethod.MFS) {
          // Show MFS payment instructions
          showMFSPaymentInstructions(data.paymentId)
        } else if (selectedMethod === PaymentMethod.CASH) {
          // Show cash payment instructions
          showCashPaymentInstructions(data.paymentId)
        }
        
        setPaymentStatus('success')
        toast.success('Payment initiated successfully')
        
        if (onPaymentSuccess) {
          onPaymentSuccess(data.paymentId)
        }
      } else {
        setPaymentStatus('error')
        toast.error(data.message || 'Payment failed')
        
        if (onPaymentError) {
          onPaymentError(data.message || 'Payment failed')
        }
      }
    } catch (error) {
      setPaymentStatus('error')
      toast.error('Payment failed. Please try again.')
      
      if (onPaymentError) {
        onPaymentError('Payment failed. Please try again.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const showMFSPaymentInstructions = (paymentId: string) => {
    toast.success(
      `Payment ID: ${paymentId}. Please send ${amount} BDT to 017XXXXXXXX via bKash/Rocket/Nagad and enter the transaction ID.`,
      { duration: 10000 }
    )
  }

  const showCashPaymentInstructions = (paymentId: string) => {
    toast.success(
      `Payment ID: ${paymentId}. Please visit our office with this payment ID to complete your payment of ${amount} BDT.`,
      { duration: 10000 }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateway</CardTitle>
          <CardDescription>
            Choose your preferred payment method to complete the transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Amount */}
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900">${amount}</h3>
            <p className="text-gray-600">Consultancy Fee</p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Select Payment Method</h3>
            <div className="grid grid-cols-1 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? `${method.borderColor} ${method.bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`${method.color}`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
              <span className="text-blue-600">Processing payment...</span>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-600">Payment initiated successfully!</span>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-600">Payment failed. Please try again.</span>
            </div>
          )}

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount}`
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center text-sm text-gray-500">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>We use industry-standard security measures to protect your data</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Details */}
      {selectedMethod && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMethod === PaymentMethod.ONLINE && (
              <div className="space-y-3">
                <h4 className="font-medium">Online Payment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Accepts all major credit and debit cards</li>
                  <li>• Secure SSL encrypted transaction</li>
                  <li>• Instant payment confirmation</li>
                  <li>• 24/7 customer support</li>
                </ul>
              </div>
            )}

            {selectedMethod === PaymentMethod.MFS && (
              <div className="space-y-3">
                <h4 className="font-medium">Mobile Financial Services</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Send money via bKash, Rocket, or Nagad</li>
                  <li>• Use the payment ID provided after confirmation</li>
                  <li>• Enter transaction ID for verification</li>
                  <li>• Payment will be confirmed within 24 hours</li>
                </ul>
              </div>
            )}

            {selectedMethod === PaymentMethod.CASH && (
              <div className="space-y-3">
                <h4 className="font-medium">Cash Payment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visit our office with the payment ID</li>
                  <li>• Pay the exact amount in cash</li>
                  <li>• Receive payment receipt immediately</li>
                  <li>• Office hours: 9 AM - 6 PM (Sunday to Thursday)</li>
                </ul>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Office Address:</p>
                  <p className="text-sm text-gray-600">
                    123 Business District, Dhaka 1000, Bangladesh
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}














