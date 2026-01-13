'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  FileText, 
  CreditCard, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import { UserStatus, ApplicationStatus } from '@/types'

export default function IndividualDashboard() {
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

    if (session?.user?.role !== 'INDIVIDUAL') {
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

  const calculateProfileCompletion = () => {
    if (!user) return 0
    
    const requiredFields = [
      'fullName', 'dateOfBirth', 'placeOfBirth', 'photoUrl',
      'birthCertificateNumber', 'nidNumber', 'passportNumber',
      'presentAddress', 'permanentAddress'
    ]
    
    const completedFields = requiredFields.filter(field => {
      const value = user[field]
      return value && (typeof value !== 'object' || Object.keys(value).length > 0)
    }).length
    
    return Math.round((completedFields / requiredFields.length) * 100)
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
          <img 
            src="/logo.png" 
            alt="Docufieds Logo" 
            className="h-16 w-36 object-contain"
          />
        </div>
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <div className="flex items-center space-x-3">
                {user.photoUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 relative">
                    <img
                      src={user.photoUrl}
                      alt={user.fullName || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image and show fallback
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center fallback-avatar hidden absolute inset-0">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-sm text-gray-500">Member ID: {user.memberId}</p>
                </div>
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
            Welcome back, {user.fullName}!
          </h1>
          <p className="text-gray-600">
            Manage your visa applications and track your progress
          </p>
        </div>

        {/* Profile Status */}
        {user.status === 'PENDING' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Profile Under Review
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Your profile is currently being reviewed. Complete your profile to speed up the process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Profile Completion</span>
                    <span>{calculateProfileCompletion()}%</span>
                  </div>
                  <Progress value={calculateProfileCompletion()} className="h-2" />
                </div>
                <Button onClick={() => router.push('/dashboard/individual/profile')}>
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                <CreditCard className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.reduce((sum, app) => sum + app.consultancyFee, 0)} BDT
                  </p>
                  <p className="text-sm text-gray-600">Total Spent</p>
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
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Track the status of your visa applications</CardDescription>
              </div>
              <Button onClick={() => router.push('/dashboard/individual/new-application')}>
                New Application
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start your first visa application to get started</p>
                <Button onClick={() => router.push('/dashboard/individual/new-application')}>
                  Create Application
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
                              <User className="h-4 w-4 mr-1" />
                              {application.memberId}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Profile Picture Display */}
            <div className="mb-6 pb-6 border-b">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Profile Picture</label>
              <div className="flex items-center space-x-4">
                {user.photoUrl ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-md">
                    <img
                      src={user.photoUrl}
                      alt={user.fullName || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center hidden">
                      <User className="h-12 w-12 text-gray-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300 shadow-md">
                    <User className="h-12 w-12 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {user.photoUrl ? 'Profile picture uploaded' : 'No profile picture'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/dashboard/individual/profile')}
                  >
                    {user.photoUrl ? 'Change Picture' : 'Upload Picture'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-gray-900">{user.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {user.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member ID</label>
                  <p className="text-gray-900 font-mono">{user.memberId || 'Not assigned'}</p>
                </div>
              </div>
              <div className="space-y-4">
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
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Place of Birth</label>
                  <p className="text-gray-900">{user.placeOfBirth || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => router.push('/dashboard/individual/profile')}>
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
