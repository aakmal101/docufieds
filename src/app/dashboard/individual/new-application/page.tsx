'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Globe,
  Loader2,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import WorldMap from '@/components/world-map'
import RequiredDocuments from '@/components/required-documents'
import CallPhaseScreen from '@/components/call-phase-screen'
import { ProcessType, Profession } from '@/types'
import toast from 'react-hot-toast'

interface Country {
  id: string
  name: string
  code: string
  continent: string
  position: [number, number, number]
  color: string
}

const processTypes = [
  { value: ProcessType.TOURIST, label: 'Tourist', description: 'Leisure travel and sightseeing' },
  { value: ProcessType.CONFERENCE, label: 'Conference', description: 'Business conferences and seminars' },
  { value: ProcessType.MEDICAL, label: 'Medical', description: 'Medical treatment and procedures' },
  { value: ProcessType.BUSINESS, label: 'Business', description: 'Business meetings and work' },
  { value: ProcessType.SPORTS, label: 'Sports', description: 'Sports events and competitions' },
  { value: ProcessType.VISIT, label: 'Visit', description: 'Family and friends visit' },
]

const professions = [
  { value: Profession.BUSINESS_OWNER, label: 'Business Owner' },
  { value: Profession.JOB_HOLDER, label: 'Job Holder' },
  { value: Profession.STUDENT, label: 'Student' },
  { value: Profession.HOMEMAKER, label: 'Homemaker' },
  { value: Profession.RETIRED, label: 'Retired' },
]

const consultancyFees = {
  [ProcessType.TOURIST]: 150,
  [ProcessType.CONFERENCE]: 200,
  [ProcessType.MEDICAL]: 300,
  [ProcessType.BUSINESS]: 250,
  [ProcessType.SPORTS]: 180,
  [ProcessType.VISIT]: 120,
}

export default function NewApplicationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<'destination' | 'process' | 'profession' | 'review' | 'documents' | 'call'>('destination')
  const [loading, setLoading] = useState(false)
  const [loadingApplication, setLoadingApplication] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    country: '',
    processType: '',
    profession: '',
  })

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'INDIVIDUAL') {
      router.push('/dashboard')
      return
    }

    // Check if there's an application ID in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const appId = urlParams.get('id')

    if (appId) {
      loadApplication(appId)
    }
  }, [session, status, router])

  const loadApplication = async (id: string) => {
    try {
      setLoadingApplication(true)
      const response = await fetch(`/api/applications/${id}`)
      const data = await response.json()

      if (data.success && data.data) {
        const app = data.data

        // Set application ID
        setApplicationId(app.id)

        // Check if application is read-only (not DRAFT)
        setIsReadOnly(app.status !== 'DRAFT')

        // Restore form data
        setFormData({
          country: app.country || '',
          processType: app.processType || '',
          profession: app.profession || '',
        })

        // Find and set selected country (you may need to match by name)
        // For now, we'll just set the country name
        if (app.country) {
          // You might need to find the country object from your countries list
          // For now, we'll create a basic country object
          setSelectedCountry({
            id: app.country.toLowerCase().replace(/\s+/g, '-'),
            name: app.country,
            code: app.country.substring(0, 2).toUpperCase(),
            continent: '',
            position: [0, 0, 0],
            color: '#3B82F6',
          })
        }

        // Determine which step to show based on application status and progress
        if (app.status === 'DRAFT') {
          // If no documents uploaded, go to documents step
          if (app.documents && app.documents.length > 0) {
            // Check if ready for Call Phase (documents + payment complete)
            const validPayments = app.payments?.filter(
              (p: any) => p.status === 'PAID' || p.status === 'PARTIAL'
            ) || []
            const totalPaid = validPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
            const paymentComplete = app.consultancyFee === 0 || totalPaid >= app.consultancyFee

            if (paymentComplete) {
              // Auto-transition to Call Phase if ready
              setStep('call')
            } else {
              setStep('documents')
            }
          } else if (app.country && app.processType && app.profession) {
            setStep('documents')
          } else if (app.country && app.processType) {
            setStep('profession')
          } else if (app.country) {
            setStep('process')
          } else {
            setStep('destination')
          }
        } else if (app.status === 'UNDER_REVIEW' || app.status === 'DOCUMENT_UNDER_REVIEW' || app.status === 'DOCUMENT_UNDER_PROCESSING') {
          // For submitted applications, show Call Phase (read-only)
          setStep('call')
        } else {
          // For other statuses, show documents step
          setStep('documents')
        }
      } else {
        toast.error('Failed to load application')
        router.push('/dashboard/individual')
      }
    } catch (error: any) {
      console.error('Error loading application:', error)
      toast.error('Failed to load application')
      router.push('/dashboard/individual')
    } finally {
      setLoadingApplication(false)
    }
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setFormData(prev => ({ ...prev, country: country.name }))
  }

  const handleNext = () => {
    if (step === 'destination' && !selectedCountry) {
      setError('Please select a destination country')
      return
    }
    if (step === 'process' && !formData.processType) {
      setError('Please select a process type')
      return
    }
    if (step === 'profession' && !formData.profession) {
      setError('Please select your profession')
      return
    }

    setError('')

    switch (step) {
      case 'destination':
        setStep('process')
        break
      case 'process':
        setStep('profession')
        break
      case 'profession':
        setStep('review')
        break
      case 'review':
        setStep('documents')
        break
      case 'documents':
        setStep('call')
        break
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'process':
        setStep('destination')
        break
      case 'profession':
        setStep('process')
        break
      case 'review':
        setStep('profession')
        break
      case 'documents':
        setStep('review')
        break
      case 'call':
        setStep('documents')
        break
    }
    setError('')
  }


  const getCurrentFee = () => {
    if (!formData.processType) return 0
    return consultancyFees[formData.processType as ProcessType]
  }

  const handleSubmit = async () => {
    if (!selectedCountry || !formData.processType || !formData.profession) {
      setError('Please complete all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      // If applicationId exists, update the existing application
      if (applicationId) {
        // For now, we'll just proceed to documents step
        // In a full implementation, you might want to update the application
        toast.success('Application updated!')
        setStep('documents')
      } else {
        // Create new application
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            country: selectedCountry.name,
            processType: formData.processType,
            profession: formData.profession,
            consultancyFee: getCurrentFee(),
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success('Application created successfully!')
          setApplicationId(data.data.id)
          setStep('documents')
        } else {
          const errorMsg = data.message || 'Failed to create application'
          setError(errorMsg)
          toast.error(errorMsg)
        }
      }
    } catch (error: any) {
      console.error('Application creation error:', error)
      const errorMsg = error?.message || 'Something went wrong. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loadingApplication) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['destination', 'process', 'profession', 'review', 'documents', 'call'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step === stepName
                ? 'border-blue-600 bg-blue-600 text-white'
                : ['destination', 'process', 'profession', 'review', 'documents', 'call'].indexOf(step) > index
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-500'
                }`}>
                {['destination', 'process', 'profession', 'review', 'documents', 'call'].indexOf(step) > index ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step === stepName ? 'text-blue-600' : 'text-gray-500'
                }`}>
                {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
              </span>
              {index < 3 && (
                <div className={`w-16 h-0.5 mx-4 ${['destination', 'process', 'profession', 'review'].indexOf(step) > index
                  ? 'bg-green-600'
                  : 'bg-gray-300'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {step === 'destination' && 'Select Destination Country'}
                {step === 'process' && 'Choose Process Type'}
                {step === 'profession' && 'Select Your Profession'}
                {step === 'review' && 'Review Application'}
                {step === 'documents' && 'Required Documents'}
                {step === 'call' && 'Application Submitted'}
              </CardTitle>
              <CardDescription>
                {step === 'destination' && 'Choose the country you want to visit'}
                {step === 'process' && 'Select the purpose of your visit'}
                {step === 'profession' && 'Tell us about your profession'}
                {step === 'review' && 'Review your application details before submitting'}
                {step === 'documents' && 'Prepare the required documents for your application'}
                {step === 'call' && 'Your application has been submitted and is now being processed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === 'destination' && (
                <div className="space-y-6">
                  {isReadOnly && (
                    <Alert>
                      <AlertDescription>
                        This application has been submitted and cannot be edited. You are viewing it in read-only mode.
                      </AlertDescription>
                    </Alert>
                  )}
                  <WorldMap
                    onCountrySelect={isReadOnly ? () => { } : handleCountrySelect}
                    selectedCountry={selectedCountry?.id}
                  />
                </div>
              )}

              {step === 'process' && (
                <div className="space-y-4">
                  {isReadOnly && (
                    <Alert>
                      <AlertDescription>
                        This application has been submitted and cannot be edited.
                      </AlertDescription>
                    </Alert>
                  )}
                  {processTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg transition-colors ${formData.processType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                        } ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-gray-300'}`}
                      onClick={() => {
                        if (!isReadOnly) {
                          setFormData(prev => ({ ...prev, processType: type.value }))
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                        <Badge variant="secondary">
                          {consultancyFees[type.value as ProcessType]} BDT
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 'profession' && (
                <div className="space-y-4">
                  {isReadOnly && (
                    <Alert>
                      <AlertDescription>
                        This application has been submitted and cannot be edited.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Select
                      value={formData.profession}
                      onValueChange={(value) => {
                        if (!isReadOnly) {
                          setFormData(prev => ({ ...prev, profession: value }))
                        }
                      }}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your profession" />
                      </SelectTrigger>
                      <SelectContent>
                        {professions.map((profession) => (
                          <SelectItem key={profession.value} value={profession.value}>
                            {profession.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Destination</h3>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                        <span>{formData.country}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Process Type</h3>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600 mr-2" />
                        <span>{processTypes.find(t => t.value === formData.processType)?.label}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Profession</h3>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <span>{professions.find(p => p.value === formData.profession)?.label}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Consultancy Fee</h3>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium">{getCurrentFee()} BDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'documents' && applicationId && (
                <RequiredDocuments
                  applicationId={applicationId}
                  onComplete={() => setStep('call')}
                  onBack={() => setStep('review')}
                />
              )}
              {step === 'documents' && !applicationId && (
                <div className="text-center py-12">
                  <Alert className="mb-4">
                    <AlertDescription>
                      Please complete the application form first before uploading documents.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => setStep('review')}>
                    Go to Review
                  </Button>
                </div>
              )}

              {step === 'call' && applicationId && (
                <CallPhaseScreen
                  applicationId={applicationId}
                  onBackToDashboard={async () => {
                    // Check if application needs to be submitted first
                    try {
                      const appResponse = await fetch(`/api/applications/${applicationId}`)
                      const appData = await appResponse.json()

                      if (appData.success && appData.data) {
                        const app = appData.data

                        // If still in DRAFT, try to submit
                        if (app.status === 'DRAFT') {
                          setLoading(true)
                          const response = await fetch(`/api/applications/${applicationId}/complete-call`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          })

                          const data = await response.json()

                          if (data.success) {
                            toast.success(data.message || 'Application successfully submitted!')
                            setTimeout(() => {
                              router.push('/dashboard/individual')
                            }, 1500)
                          } else {
                            // Handle validation errors
                            if (data.missingDocuments) {
                              const missingList = data.missingDocuments.map((d: any) => d.documentType).join(', ')
                              toast.error(`Please upload all required documents: ${missingList}`, {
                                duration: 5000,
                              })
                              setStep('documents')
                            } else if (data.requiredAmount) {
                              toast.error(`Payment required: ${data.requiredAmount} BDT. Please complete payment before finalizing.`, {
                                duration: 5000,
                              })
                              setStep('documents')
                            } else {
                              toast.error(data.message || 'Failed to submit application. Please check all requirements.')
                            }
                            setLoading(false)
                          }
                        } else {
                          // Already submitted, just go to dashboard
                          router.push('/dashboard/individual')
                        }
                      } else {
                        router.push('/dashboard/individual')
                      }
                    } catch (error: any) {
                      console.error('Error checking application status:', error)
                      router.push('/dashboard/individual')
                    }
                  }}
                />
              )}

              {step !== 'documents' && step !== 'call' && (
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 'destination'}
                  >
                    Back
                  </Button>
                  {step === 'review' ? (
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Application...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Destination</label>
                <p className="text-gray-900">{formData.country || 'Not selected'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Process Type</label>
                <p className="text-gray-900">
                  {processTypes.find(t => t.value === formData.processType)?.label || 'Not selected'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Profession</label>
                <p className="text-gray-900">
                  {professions.find(p => p.value === formData.profession)?.label || 'Not selected'}
                </p>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Consultancy Fee</span>
                  <span className="font-bold text-lg text-blue-600">{getCurrentFee()} BDT</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Submit Application</p>
                  <p className="text-xs text-gray-600">Create your visa application</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Make Payment</p>
                  <p className="text-xs text-gray-600">Pay consultancy fee</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Upload Documents</p>
                  <p className="text-xs text-gray-600">Submit required documents</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Track Progress</p>
                  <p className="text-xs text-gray-600">Monitor application status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



