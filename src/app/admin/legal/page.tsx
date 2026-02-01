'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function LegalDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/legal/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Legal Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Process forwarded applications, review documents, and issue final validation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.pendingReview || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting legal processing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ready to Deliver</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.readyToDeliver || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Processing completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.rejected || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Declined by legal</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.avgProcessingTime || 'N/A'}</div>
            <p className="text-xs text-gray-500 mt-1">Submission to Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Quick Actions or Recent Activity if needed */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900">Legal Workflow Reminder</h3>
          <p className="text-sm text-blue-700 mt-1">
            Applications appear here only after Support Lead forwards them.
            Your actions (Ready to Deliver / Reject) are final and instantly visible to Support.
            Payment data is not accessible in this portal.
          </p>
        </div>
      </div>
    </div>
  )
}
