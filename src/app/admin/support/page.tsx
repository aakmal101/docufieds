
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

// ... imports ...

export default function SupportDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)

  // New state for module-aware document configuration
  // Structure: { documentType: string, module: string | null }[]
  const [requirementsWithModules, setRequirementsWithModules] = useState<{ documentType: string, module: string | null }[]>([])

  // Helper state for adding new requirements
  const [newDocType, setNewDocType] = useState('')
  const [targetModule, setTargetModule] = useState<string>('GLOBAL')

  const [submittedApplications, setSubmittedApplications] = useState<any[]>([])
  const [selectedAppForMessaging, setSelectedAppForMessaging] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  // ... useEffects and other methods ...


  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/applications')
      const data = await response.json()
      if (data.success) {
        setApplications(data.data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'DOCUMENT_UNDER_REVIEW': return 'bg-purple-100 text-purple-800'
      case 'ACTION_REQUIRED': return 'bg-red-100 text-red-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCallbackComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${id}/callback-complete`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Callback marked as complete')
        fetchApplications()
      } else {
        toast.error(data.message || 'Action failed')
      }
    } catch (error) {
      console.error('Error marking callback complete:', error)
      toast.error('Action failed')
    }
  }

  const handleAddRequirement = () => {
    if (!newDocType) return;
    const moduleValue = targetModule === 'GLOBAL' ? null : targetModule;
    setRequirementsWithModules([...requirementsWithModules, { documentType: newDocType, module: moduleValue }]);
    setNewDocType('');
  };

  const handleRemoveRequirement = (index: number) => {
    const updated = [...requirementsWithModules];
    updated.splice(index, 1);
    setRequirementsWithModules(updated);
  };

  const handleConfigureDocuments = async () => {
    if (!selectedApplication || requirementsWithModules.length === 0) return

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/configure-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementsWithModules }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Document requirements configured')
        // Update application status
        fetchApplications()
        setSelectedApplication(null)
        setRequirementsWithModules([])
        setNewDocType('')
        setTargetModule('GLOBAL')
      } else {
        toast.error(data.message || 'Failed to configure documents')
      }
    } catch (error) {
      console.error('Error configuring documents:', error)
      toast.error('Error configuring documents')
    }
  }

  // ... other handlers ...

  // Pre-defined common documents can be used as suggestions
  const COMMON_DOCS = [
    'Passport', 'Visa Application Form', 'Photograph', 'Financial Documents',
    'Travel Itinerary', 'Hotel Booking', 'Employment Letter'
  ]

  // ... rendering ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... header ... */}

      {/* ... stats ... */}

      {/* ... submitted queue ... */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Requiring Attention</CardTitle>
            <CardDescription>Applications that need callback or document configuration</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              // ... empty state ...
              <div className="text-center py-8">
                <p className="text-gray-600">No applications require attention</p>
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
                            {/* ... title and status ... */}
                            <h3 className="text-lg font-medium text-gray-900">
                              {application.country} - {application.processType}
                            </h3>
                            <Badge className={getStatusColor(application.status)}>
                              {application.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>

                          {/* Display Modules */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {application.modules?.map((m: any) => (
                              <Badge key={m.id} variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700">
                                {m.module.charAt(0) + m.module.slice(1).toLowerCase()}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            {/* ... existing details ... */}
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {application.user?.fullName || 'Unknown User'}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {/* ... buttons ... */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setRequirementsWithModules([]);
                            }}
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
              <div className="space-y-6">
                <div>
                  <Label>Application Details</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                    <p><strong>Country:</strong> {selectedApplication.country}</p>
                    <p><strong>Process Type:</strong> {selectedApplication.processType}</p>
                    <p><strong>Profession:</strong> {selectedApplication.profession || 'Not specified'}</p>
                    <p><strong>Modules:</strong> {selectedApplication.modules?.map((m: any) => m.module).join(', ') || 'None'}</p>
                  </div>
                </div>

                {/* Add New Requirement */}
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50/50">
                  <h4 className="font-medium text-sm">Add Requirement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Document Name</Label>
                      <Input
                        placeholder="E.g. Passport"
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Module Scope</Label>
                      <Select value={targetModule} onValueChange={setTargetModule}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GLOBAL">Global (All Modules)</SelectItem>
                          {selectedApplication.modules?.map((m: any) => (
                            <SelectItem key={m.id} value={m.module}>
                              {m.module} Module
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddRequirement} size="sm" className="w-full" disabled={!newDocType}>
                    Add to List
                  </Button>

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COMMON_DOCS.map(doc => (
                      <Badge
                        key={doc}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200"
                        onClick={() => setNewDocType(doc)}
                      >
                        + {doc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Configured List */}
                <div>
                  <Label>Configured Requirements ({requirementsWithModules.length})</Label>
                  <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                    {requirementsWithModules.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No documents added yet.</p>
                    )}

                    {requirementsWithModules.map((req, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white border rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{req.documentType}</span>
                          {req.module ? (
                            <Badge variant="outline" className="text-[10px]">{req.module}</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Global</Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveRequirement(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleConfigureDocuments}
                    disabled={requirementsWithModules.length === 0}
                  >
                    Save Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedApplication(null)
                      setRequirementsWithModules([])
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
                <p className="text-gray-600">Select an application to configure document requirements</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ... messaging modal ... */}
    </div>
  )
}



