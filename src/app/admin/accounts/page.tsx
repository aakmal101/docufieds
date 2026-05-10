'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  User,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react'

export default function AccountsDashboard() {
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setPayments([
        {
          id: '1',
          amount: 150,
          status: 'PAID',
          method: 'ONLINE',
          user: { fullName: 'John Doe' },
          application: { country: 'USA', processType: 'TOURIST' },
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString()
        },
        {
          id: '2',
          amount: 200,
          status: 'PENDING',
          method: 'MFS',
          user: { fullName: 'Jane Smith' },
          application: { country: 'UK', processType: 'BUSINESS' },
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          amount: 300,
          status: 'PAID',
          method: 'CASH',
          user: { fullName: 'Mike Johnson' },
          application: { country: 'Canada', processType: 'MEDICAL' },
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/auth/signin'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading accounts dashboard...</p>
        </div>
      </div>
    )
  }

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">Docufieds</span>
              <Badge className="ml-4" variant="secondary">Accounts Team</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Accounts Officer</p>
                <p className="text-sm text-gray-500">Accounts Team</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts Dashboard</h1>
          <p className="text-gray-600">Manage payments, revenue, and financial transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{pendingAmount.toLocaleString()} BDT</p>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{payments.filter(p => p.status === 'PAID').length}</p>
                  <p className="text-sm text-gray-600">Completed Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{payments.filter(p => p.status === 'PENDING').length}</p>
                  <p className="text-sm text-gray-600">Pending Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Revenue breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['ONLINE', 'MFS', 'CASH'].map((method) => {
                  const methodPayments = payments.filter(p => p.method === method && p.status === 'PAID')
                  const amount = methodPayments.reduce((sum, p) => sum + p.amount, 0)
                  const count = methodPayments.length
                  return (
                    <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{method}</span>
                      <div className="text-right">
                        <p className="font-semibold">{amount.toLocaleString()} BDT</p>
                        <p className="text-sm text-gray-600">{count} transactions</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.user.fullName}</p>
                      <p className="text-sm text-gray-600">{payment.application.country} - {payment.application.processType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{payment.amount} BDT</p>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
            <CardDescription>Complete list of all payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments</h3>
                <p className="text-gray-600">No payment transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{payment.user.fullName}</h3>
                          <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            {payment.method}
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {payment.application.country} - {payment.application.processType}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{payment.amount} BDT</p>
                        {payment.paidAt && (
                          <p className="text-sm text-gray-600">Paid: {new Date(payment.paidAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
