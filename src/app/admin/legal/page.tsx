'use client'

// Force dynamic rendering - this page fetches from /api/admin/applications which uses headers/cookies
export const dynamic = 'force-dynamic'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  User,
  Calendar,
  CreditCard,
  Scale
} from 'lucide-react'

export default function LegalDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'LEGAL') {
      router.push('/dashboard')
      return
    }

    fetchApplications()
  }, [session, status, router])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications')
      const data = await response.json()
      
      if (data.success) {
        setApplications(data.data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PROCESSED':
        return 'bg-red-100 text-red-800'
      case 'DOCUMENT_UNDER_PROCESSING':
        return 'bg-purple-100 text-purple-800'
      case 'DOCUMENT_UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW':
        return 'bg-orange-100 text-orange-800'
      case 'DECLINED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading legal dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">Docufieds</span>
              <Badge className="ml-4" variant="secondary">Legal Team</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session?.user?.fullName}</p>
                <p className="text-sm text-gray-500">Legal Team</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Legal Team Dashboard
          </h1>
          <p className="text-gray-600">
            Review and process legal documents for visa applications
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => app.status === 'DOCUMENT_UNDER_PROCESSING').length}
                  </p>
                  <p className="text-sm text-gray-600">Ready for Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => app.status === 'PROCESSED').length}
                  </p>
                  <p className="text-sm text-gray-600">Processed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => 
                      ['DOCUMENT_UNDER_PROCESSING', 'DOCUMENT_UNDER_REVIEW'].includes(app.status)
                    ).length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Scale className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => app.status === 'COMPLETED').length}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications for Legal Review</CardTitle>
            <CardDescription>Applications ready for legal document processing</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications</h3>
                <p className="text-gray-600">No applications require legal review at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications
                  .filter(app => ['DOCUMENT_UNDER_PROCESSING', 'DOCUMENT_UNDER_REVIEW'].includes(app.status))
                  .map((application) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {application.country} - {application.processType}
                          </h3>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {application.user?.fullName || 'Unknown User'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            ${application.consultancyFee}
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Documents: {application.documents?.length || 0} uploaded
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Review Documents
                        </Button>
                        <Button size="sm">
                          Process
                        </Button>
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








