'use client'

// Force dynamic rendering - this page fetches from /api/admin/applications which uses headers/cookies
export const dynamic = 'force-dynamic'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Phone,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  User,
  Calendar,
  CreditCard,
  Settings,
  MessageCircle,
  Send,
  X
} from 'lucide-react'
import { ApplicationStatus } from '@/types'
import toast from 'react-hot-toast'

export default function SupportDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [documentRequirements, setDocumentRequirements] = useState<string[]>([])
  const [submittedApplications, setSubmittedApplications] = useState<any[]>([])
  const [selectedAppForMessaging, setSelectedAppForMessaging] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Allow ADMIN and SUPPORT roles
    const allowedRoles = ['ADMIN', 'SUPPORT']
    if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
      router.push('/dashboard')
      return
    }

    fetchApplications()
  }, [session, status, router])

  const fetchApplications = async () => {
    try {
      // Fetch all submitted applications using the updated main API
      const response = await fetch('/api/applications')
      const data = await response.json()

      if (data.success) {
        // Both states can use the same data since the API now filters for us (non-DRAFT for Support)
        setApplications(data.data)
        setSubmittedApplications(data.data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/messages?applicationId=${applicationId}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAppForMessaging) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedAppForMessaging.id,
          userId: selectedAppForMessaging.userId,
          text: newMessage.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNewMessage('')
        await fetchMessages(selectedAppForMessaging.id)
        toast.success('Message sent successfully')
      } else {
        toast.error(data.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleOpenMessaging = (application: any) => {
    setSelectedAppForMessaging(application)
    fetchMessages(application.id)
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

  const handleConfigureDocuments = async () => {
    if (!selectedApplication || documentRequirements.length === 0) return

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/configure-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentRequirements }),
      })

      const data = await response.json()

      if (data.success) {
        // Update application status
        await fetchApplications()
        setSelectedApplication(null)
        setDocumentRequirements([])
      }
    } catch (error) {
      console.error('Error configuring documents:', error)
    }
  }

  const handleCallbackComplete = async (applicationId: string, note?: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/callback-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminNote: note || adminNote,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAdminNote('')
        await fetchApplications()
        if (selectedAppForMessaging?.id === applicationId) {
          setSelectedAppForMessaging(null)
        }
        toast.success('Callback completed successfully')
      } else {
        toast.error(data.message || 'Failed to complete callback')
      }
    } catch (error) {
      console.error('Error completing callback:', error)
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
          <p>Loading support dashboard...</p>
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
              <Badge className="ml-4" variant="secondary">Support Team</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session?.user?.fullName}</p>
                <p className="text-sm text-gray-500">Support Team</p>
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
            Support Team Dashboard
          </h1>
          <p className="text-gray-600">
            Manage customer callbacks and configure document requirements
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Phone className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => app.status === 'UNDER_REVIEW').length}
                  </p>
                  <p className="text-sm text-gray-600">Pending Callbacks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => app.status === 'DOCUMENT_UNDER_REVIEW').length}
                  </p>
                  <p className="text-sm text-gray-600">Document Review</p>
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
                      ['UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW'].includes(app.status)
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
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter(app => app.status === 'DOCUMENT_UNDER_PROCESSING').length}
                  </p>
                  <p className="text-sm text-gray-600">Ready for Legal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submitted Applications Queue */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submitted Applications Queue</CardTitle>
            <CardDescription>Applications with status UNDER_REVIEW or beyond - ready for support handling</CardDescription>
          </CardHeader>
          <CardContent>
            {submittedApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submitted applications</h3>
                <p className="text-gray-600">No applications have been submitted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submittedApplications.map((application) => {
                  const lastActivity = application.statusUpdates?.[0]?.createdAt || application.updatedAt
                  const unreadMessages = application.messages?.filter((m: any) =>
                    m.senderRole !== session?.user?.role && !m.isRead
                  ).length || 0

                  return (
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
                            {unreadMessages > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {unreadMessages} new
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {application.user?.fullName || 'Unknown User'}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Submitted: {new Date(application.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Last activity: {new Date(lastActivity).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Application ID: {application.id}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMessaging(application)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          {application.status === 'UNDER_REVIEW' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const note = prompt('Add admin note (optional):')
                                if (note !== null) {
                                  handleCallbackComplete(application.id, note)
                                }
                              }}
                            >
                              Complete Callback
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>Applications Requiring Attention</CardTitle>
              <CardDescription>Applications that need callback or document configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications</h3>
                  <p className="text-gray-600">No applications require attention at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications
                    .filter(app => ['UNDER_REVIEW', 'DOCUMENT_UNDER_REVIEW'].includes(app.status))
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
                                {application.consultancyFee} BDT
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              Configure
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCallbackComplete(application.id)}
                            >
                              Callback Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Document Configuration</CardTitle>
              <CardDescription>
                {selectedApplication
                  ? `Configure document requirements for ${selectedApplication.country} - ${selectedApplication.processType}`
                  : 'Select an application to configure document requirements'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedApplication ? (
                <div className="space-y-4">
                  <div>
                    <Label>Application Details</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p><strong>Country:</strong> {selectedApplication.country}</p>
                      <p><strong>Process Type:</strong> {selectedApplication.processType}</p>
                      <p><strong>Profession:</strong> {selectedApplication.profession || 'Not specified'}</p>
                      <p><strong>Client:</strong> {selectedApplication.user?.fullName}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Required Documents</Label>
                    <div className="mt-2 space-y-2">
                      {[
                        'Passport',
                        'Visa Application Form',
                        'Photograph',
                        'Financial Documents',
                        'Travel Itinerary',
                        'Hotel Booking',
                        'Employment Letter',
                        'Bank Statements',
                        'Travel Insurance',
                        'Birth Certificate',
                        'Marriage Certificate',
                        'Educational Certificates'
                      ].map((doc) => (
                        <label key={doc} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={documentRequirements.includes(doc)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDocumentRequirements([...documentRequirements, doc])
                              } else {
                                setDocumentRequirements(documentRequirements.filter(d => d !== doc))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleConfigureDocuments}
                      disabled={documentRequirements.length === 0}
                    >
                      Configure Documents
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedApplication(null)
                        setDocumentRequirements([])
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Application Selected</h3>
                  <p className="text-gray-600">Select an application from the list to configure document requirements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messaging Modal/Overlay */}
        {selectedAppForMessaging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Messaging: {selectedAppForMessaging.user?.fullName}</CardTitle>
                    <CardDescription>
                      {selectedAppForMessaging.country} - {selectedAppForMessaging.processType}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAppForMessaging(null)
                      setMessages([])
                      setNewMessage('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'SUPPORT' || message.senderRole === 'ADMIN'
                          ? 'justify-end'
                          : 'justify-start'
                        }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${message.senderRole === 'SUPPORT' || message.senderRole === 'ADMIN'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${message.senderRole === 'SUPPORT' || message.senderRole === 'ADMIN'
                              ? 'text-red-100'
                              : 'text-gray-500'
                            }`}
                        >
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}



