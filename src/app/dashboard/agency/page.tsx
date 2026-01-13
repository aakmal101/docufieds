'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  FileText, 
  CreditCard, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import { UserStatus, ApplicationStatus } from '@/types'

export default function AgencyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'AGENCY') {
      router.push('/dashboard')
      return
    }

    fetchUserData()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (data.success) {
        setUser(data.data)
      }

      const appsResponse = await fetch('/api/applications')
      const appsData = await appsResponse.json()
      
      if (appsData.success) {
        setApplications(appsData.data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW':
        return 'bg-red-100 text-red-800'
      case 'DECLINED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStatusColor = (status: string) => {
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

  const getCreditUtilization = () => {
    if (!user || !user.creditLimit) return 0
    return Math.round((user.outstandingAmount / user.creditLimit) * 100)
  }

  const getDocumentUtilization = () => {
    if (!user || !user.documentLimit) return 0
    const pendingDocs = applications.filter(app => 
      ['DRAFT', 'UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW', 'DOCUMENT_UNDER_PROCESSING'].includes(app.status)
    ).length
    return Math.round((pendingDocs / user.documentLimit) * 100)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p>Error loading user data</p>
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
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.agencyName}</p>
                <p className="text-sm text-gray-500">Agency License: {user.agencyLicense}</p>
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
            Welcome back, {user.agencyName}!
          </h1>
          <p className="text-gray-600">
            Manage your agency's visa applications and track your business performance
          </p>
        </div>

        {/* Credit and Document Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <DollarSign className="h-5 w-5 mr-2" />
                Credit Utilization
              </CardTitle>
              <CardDescription className="text-red-700">
                Outstanding: {user.outstandingAmount || 0} / {user.creditLimit || 0} BDT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Credit Used</span>
                  <span>{getCreditUtilization()}%</span>
                </div>
                <Progress value={getCreditUtilization()} className="h-2" />
                {getCreditUtilization() > 80 && (
                  <div className="flex items-center text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>High credit utilization</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <FileText className="h-5 w-5 mr-2" />
                Document Limit
              </CardTitle>
              <CardDescription className="text-green-700">
                Pending documents: {applications.filter(app => 
                  ['DRAFT', 'UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW', 'DOCUMENT_UNDER_PROCESSING'].includes(app.status)
                ).length} / {user.documentLimit || 10}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Documents Used</span>
                  <span>{getDocumentUtilization()}%</span>
                </div>
                <Progress value={getDocumentUtilization()} className="h-2" />
                {getDocumentUtilization() > 80 && (
                  <div className="flex items-center text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>Approaching document limit</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
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
                    {applications.filter(app => app.status === 'COMPLETED').length}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
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
                      ['UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW', 'DOCUMENT_UNDER_PROCESSING'].includes(app.status)
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
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.reduce((sum, app) => sum + app.consultancyFee, 0)} BDT
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Agency Applications</CardTitle>
                <CardDescription>Manage and track all your agency's visa applications</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => router.push('/dashboard/agency/bulk-upload')}>
                  Bulk Upload
                </Button>
                <Button onClick={() => router.push('/dashboard/agency/new-application')}>
                  New Application
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start processing visa applications for your clients</p>
                <Button onClick={() => router.push('/dashboard/agency/new-application')}>
                  Create First Application
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {application.country} - {application.processType}
                          </h3>
                          <Badge className={getApplicationStatusColor(application.status)}>
                            {application.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            {application.consultancyFee} BDT
                          </div>
                          {application.memberId && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {application.memberId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agency Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
            <CardDescription>Your agency details and account status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Agency Name</label>
                  <p className="text-gray-900">{user.agencyName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">License Number</label>
                  <p className="text-gray-900 font-mono">{user.agencyLicense || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="text-gray-900">{user.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {user.phone || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Status</label>
                  <div className="flex items-center">
                    <Badge className={getStatusColor(user.status)}>
                      {user.status.replace(/_/g, ' ')}
                    </Badge>
                    {user.isVerified && (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Credit Limit</label>
                  <p className="text-gray-900">{user.creditLimit || 0} BDT</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/agency/profile')}>
                Edit Profile
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/agency/payments')}>
                View Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



