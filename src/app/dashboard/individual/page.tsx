'use client'

export const dynamic = 'force-dynamic'


import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ShieldCheck,
  XCircle
} from 'lucide-react'
import { UserStatus, ApplicationStatus } from '@/types'

export default function IndividualDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [fetchError, setFetchError] = useState(false)

  // Compute display name from individualProfile (fullName does not exist on User model)
  const displayName = user?.individualProfile?.firstName
    ? `${user.individualProfile.firstName} ${user.individualProfile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User'

  // Throttle fetching: prevent fetch if last one was < 2 minutes ago
  const lastFetchTime = useRef<number>(0)

  useEffect(() => {
    // Middleware handles auth gating — if we're here, user is authenticated
    // Check throttle — but only skip if we already have user data
    const now = Date.now()
    if (user && now - lastFetchTime.current < 120 * 1000) {
      // Data is fresh enough
      setLoading(false)
      return
    }

    lastFetchTime.current = now
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setFetchError(false)
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (data.success) {
        setUser(data.data)
      } else {
        setFetchError(true)
      }

      const appsResponse = await fetch('/api/applications')
      const appsData = await appsResponse.json()

      if (appsData.success) {
        setApplications(appsData.data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setFetchError(true)
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

  const getApplicationStatusLabel = (status: string) => {
    switch (status) {
      case 'UNDER_REVIEW':
      case 'DOCUMENT_UNDER_REVIEW':
      case 'DOCUMENT_UNDER_PROCESSING':
        return 'Submitted – Processing'
      case 'COMPLETED':
        return 'Completed'
      case 'PROCESSED':
        return 'Processed'
      case 'DECLINED':
        return 'Declined'
      case 'CANCELLED':
        return 'Cancelled'
      case 'DRAFT':
        return 'Draft'
      default:
        return status.replace(/_/g, ' ')
    }
  }

  const calculateProfileCompletion = () => {
    if (!user) return 0

    // Check both User-level fields and nested individualProfile fields
    const userFields = [
      'dateOfBirth', 'placeOfBirth', 'photoUrl',
      'birthCertificateNumber', 'nidNumber',
      'presentAddress', 'permanentAddress'
    ]
    const profileFields = ['firstName', 'passportNumber']
    const totalRequired = userFields.length + profileFields.length

    let completedCount = userFields.filter(field => {
      const value = user[field]
      return value && (typeof value !== 'object' || Object.keys(value).length > 0)
    }).length

    completedCount += profileFields.filter(field => {
      const value = user?.individualProfile?.[field]
      return value && value.toString().trim() !== ''
    }).length

    return Math.round((completedCount / totalRequired) * 100)
  }

  // Show skeleton while loading OR while user data hasn't arrived yet (throttle edge-case)
  if (loading || (!user && !fetchError)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Welcome skeleton */}
        <div className="mb-8">
          <div className="h-8 w-72 bg-gray-200 rounded-md mb-2" />
          <div className="h-4 w-96 bg-gray-100 rounded-md" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-md" />
                <div className="ml-4 flex-1">
                  <div className="h-6 w-12 bg-gray-200 rounded-md mb-1" />
                  <div className="h-3 w-24 bg-gray-100 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Applications skeleton */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-5 w-44 bg-gray-200 rounded-md mb-2" />
              <div className="h-3 w-64 bg-gray-100 rounded-md" />
            </div>
            <div className="h-9 w-32 bg-gray-200 rounded-md" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded-md mb-3" />
                    <div className="flex items-center space-x-6">
                      <div className="h-3 w-24 bg-gray-100 rounded-md" />
                      <div className="h-3 w-20 bg-gray-100 rounded-md" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-gray-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">Loading your applications...</p>
      </div>
    )
  }

  // Only show error after fetch has definitively failed
  if (fetchError && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full bg-gray-50 rounded-lg border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Unable to load your dashboard data</p>
          <Button variant="outline" onClick={() => { setLoading(true); fetchUserData() }}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {displayName}!
            </h1>
            {user.profileStatus === 'APPROVED' && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified Account
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Manage your visa applications and track your progress
          </p>
        </div>

        {/* Profile Status */}
        {user.profileStatus === 'PENDING_REVIEW' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Profile Under Review
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Your profile is currently being reviewed by our admin team. You will be notified once verified.
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
                <Button variant="outline" onClick={() => router.push('/dashboard/individual/profile')}>
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user.profileStatus === 'DECLINED' && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Profile Review Declined
              </CardTitle>
              <CardDescription className="text-red-700">
                {user.profileReviewNotes || 'Your profile was declined. Please update your information and resubmit.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/individual/profile')}>
                Update Profile
              </Button>
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
              <Button onClick={() => router.push('/apply/module')}>
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
                <Button onClick={() => router.push('/apply/module')}>
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
                            {getApplicationStatusLabel(application.status)}
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
                              {application.memberId}
                            </div>
                          )}
                        </div>
                      </div>
                      {application.status === 'DRAFT' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            router.push(`/dashboard/individual/new-application?id=${application.id}`)
                          }}
                        >
                          Continue Application
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to Status Page
                            router.push(`/dashboard/individual/applications/${application.id}`)
                          }}
                        >
                          View Status
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  )
}
