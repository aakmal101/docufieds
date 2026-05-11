'use client'



import React, { useState, useEffect, Suspense } from 'react'
import { ComponentErrorBoundary } from '@/components/ui/component-error-boundary'
import { useRouter, useSearchParams } from 'next/navigation'

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

  CheckCircle,
  Briefcase,
  Heart,
  Plane,
  User
} from 'lucide-react'
import WorldMap from '@/components/world-map'
// import RequiredDocuments directly removed to prevent SSR/Module crashes
import CallPhaseScreen from '@/components/call-phase-screen'
import { ProcessType, Profession } from '@/types'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import TradeLicenseForm from '@/components/applications/trade-license-form'

const RequiredDocuments = dynamic(
  () => import('@/components/required-documents'),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" /><p>Loading Documents...</p></div>
  }
)

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

// Custom Error Boundary for component-level isolation
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('NewApplication Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h3 className="text-red-800 font-semibold mb-2">Application Form Error</h3>
          <p className="text-red-600 mb-4">Something went wrong loading this form.</p>
          <p className="text-xs font-mono bg-white p-2 border rounded mb-4 overflow-auto max-w-full">
            {this.state.error?.message}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapped component to use search params
function NewApplicationContent() {

  const router = useRouter()
  const searchParams = useSearchParams()
  // Step 1: Module Selection (New Flow)
  const [step, setStep] = useState<'modules' | 'category' | 'trade-license' | 'destination' | 'process' | 'profession' | 'review' | 'documents' | 'call'>('modules')
  const [loading, setLoading] = useState(false)
  const [loadingApplication, setLoadingApplication] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    country: '',
    processType: '',
    profession: '',
  })

  // Single module selection as per request ("Save module value")
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [supportFee, setSupportFee] = useState<number | null>(null)

  // Module definitions (Exact Match to User Request)
  const MODULES = [
    { id: 'PERSONAL', label: 'Personal / Tourism', description: 'Tourism, family visits, or personal reasons', icon: User, required: false },
    { id: 'EDUCATION', label: 'Education / Student', description: 'University, language schools, or academic programs', icon: User, required: false }, // Use GraduationCap if available, else User
    { id: 'BUSINESS', label: 'Business / Work', description: 'Corporate trips, meetings, or employment', icon: Briefcase, required: false },
    { id: 'HEALTH', label: 'Health / Medical', description: 'Medical treatment or consultations', icon: Heart, required: false },
    { id: 'TRAVEL', label: 'Travel / Group', description: 'Group travel or general trips', icon: Plane, required: false },
  ]

  const BUSINESS_CATEGORIES = [
    { id: 'TRADE_LICENSE', label: 'Trade License', description: 'Apply for a new trade license or renew existing one', comingSoon: false },
    // ── Coming Soon categories (preserved for future integration) ──
    { id: 'BUSINESS_VISA', label: 'Business Visa', description: 'Visa for business travel and meetings', comingSoon: true },
    { id: 'COMPANY_REGISTRATION', label: 'Company Registration', description: 'Register a new company (Ltd, Partnership, etc.)', comingSoon: true },
  ]

  useEffect(() => {
    // Check if there's an application ID in the URL
    const appId = searchParams.get('id')
    console.log('[NewApplication] App ID from params:', appId)

    if (appId) {
      loadApplication(appId)
    }
  }, [router, searchParams])

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

        // Set support fee if available
        if (app.supportFeeAmount !== undefined && app.supportFeeAmount !== null) {
          setSupportFee(app.supportFeeAmount)
        }

        // Restore modules (single module)
        if ((app as any).module) {
          setSelectedModule((app as any).module)
        } else if (app.modules && app.modules.length > 0) {
          // Fallback for legacy multi-module structure if any
          setSelectedModule(app.modules[0].module)
        }

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
          // Logic to resume step...
          if (app.documents && app.documents.length > 0) {
            // ... check payment ...
            const validPayments = app.payments?.filter(
              (p: any) => p.status === 'PAID' || p.status === 'PARTIAL'
            ) || []
            const totalPaid = validPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
            const feeToPay = app.supportFeeAmount ?? app.consultancyFee
            const paymentComplete = feeToPay === 0 || totalPaid >= feeToPay

            if (paymentComplete && feeToPay > 0) {
              setStep('call')
            } else if (feeToPay === 0 && app.supportFeeAssignedAt) {
              // Fee is 0 but assigned (meaning free?), proceed. 
              // If not assigned, wait? No, allow docs.
              setStep('call') // Or documents?
              // Actually, if docs are uploaded, we stay at docs until user clicks continue?
              // The original logic checked payment complete.
              // Let's stick to original flow: Documents -> Call (Payment is parallel/later?)
              // Wait, original logic:
              // if (paymentComplete) setStep('call') else setStep('documents')
              // This implies Payment is BEFORE Call but AFTER Documents?
              // Current UI: Documents Step -> "Continue" -> Checks Payment -> Call Step.
              // So if we are loading DRAFT, and docs exist, we might be at Documents.
              setStep('documents')
            } else {
              setStep('documents')
            }
          } else if (app.country && (app.processType || (app as any).module) && app.profession) {
            setStep('documents')
          } else if (app.country && (app as any).module) {
            // Skip process, go to profession
            setStep('profession')
          } else if (app.country && app.processType) {
            setStep('profession')
          } else if (app.country) {
            // If module selected, next is profession (skip process)
            if ((app as any).module) {
              setStep('profession')
            } else {
              setStep('process')
            }
          } else if ((app as any).module) {
            // Has module, needs destination
            setStep('destination')
          } else {
            // Has nothing, start at modules
            setStep('modules')
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


  // Handle module query param from new flow
  useEffect(() => {
    const moduleParam = searchParams.get('module')
    if (moduleParam && !selectedModule && step === 'modules') {
      // Validate against ModuleType enum/list if needed, or just set it
      // We assume the param is valid if coming from our own page
      setSelectedModule(moduleParam)
      if (moduleParam === 'BUSINESS') {
        setStep('category')
      } else {
        setStep('destination')
      }
    }
  }, [searchParams, selectedModule, step])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setFormData(prev => ({ ...prev, country: country.name }))
  }

  // Determine available steps based on context
  const steps = selectedModule
    ? selectedModule === 'BUSINESS' && !formData.processType // Step to choose business category if not yet chosen
      ? ['modules', 'category', 'details', 'review', 'documents', 'call'] // Generic placeholder path
      : formData.processType === 'TRADE_LICENSE'
        ? ['modules', 'trade-license'] // Trade License has its own internal stepper
        : ['modules', 'destination', 'profession', 'review', 'documents', 'call']
    : ['modules', 'destination', 'process', 'profession', 'review', 'documents', 'call']

  const handleNext = () => {
    if (step === 'modules' && !selectedModule) {
      setError('Please select an application type')
      return
    }
    if (step === 'destination' && !selectedCountry) {
      setError('Please select a destination country')
      return
    }
    // Only check processType if we are on the process step
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
      case 'modules':
        if (selectedModule === 'BUSINESS') {
          setStep('category') // New intermediate step
        } else {
          setStep('destination')
        }
        break
      case 'category':
        if (formData.processType === 'TRADE_LICENSE') {
          setStep('trade-license')
        } else {
          setStep('destination') // Fallback for others for now
        }
        break
      case 'destination':
        // Skip process step if module selected
        setStep(selectedModule ? 'profession' : 'process')
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
      case 'category':
        setStep('modules')
        break
      case 'trade-license':
        setStep('category')
        break
      case 'destination':
        if (selectedModule === 'BUSINESS') {
          setStep('category')
        } else {
          setStep('modules')
        }
        break
      case 'process':
        setStep('destination')
        break
      case 'profession':
        // Skip process step if module selected
        setStep(selectedModule ? 'destination' : 'process')
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
    // Standard 2000 BDT fee for all modules and process types
    return 2000
  }

  const handleSubmit = async (submitData?: any) => {
    // Validate required fields (skip processType choice if module selected)
    // If trade license, separate submit handler logic
    if (step === 'trade-license' && submitData) {
      setLoading(true)
      setError('')
      try {
        // If a draft already exists (from onSaveDraft), update it instead of creating a duplicate
        const isUpdate = !!applicationId
        const url = isUpdate ? `/api/applications/${applicationId}` : '/api/applications'
        const method = isUpdate ? 'PATCH' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: 'Bangladesh',
            processType: 'TRADE_LICENSE',
            profession: 'BUSINESS_OWNER',
            consultancyFee: 2000,
            module: 'BUSINESS',
            answers: submitData,
            status: 'UNDER_REVIEW', // Mark as submitted
          })
        })
        const data = await response.json()
        if (data.success) {
          setApplicationId(data.data.id)
          setStep('call')
        } else {
          toast.error(data.message || 'Failed to submit')
        }
      } catch (e: any) {
        console.error(e)
        toast.error('Submission failed')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!selectedCountry || !formData.profession || !selectedModule) {
      // If NOT module based, processType is required
      if (!selectedModule && !formData.processType) {
        setError('Please complete all required fields')
        return
      }
      if (selectedModule && !formData.profession) {
        setError('Please complete all required fields')
        return
      }
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
            country: selectedCountry?.name,
            // Use 'standard' or similar default for module-based apps if processType is skipped
            processType: selectedModule ? 'standard' : formData.processType,
            profession: formData.profession,
            consultancyFee: 2000, // Standard 2000 BDT fee
            module: selectedModule // Singular
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  // Debug log for render
  console.log('[NewApplication] Rendering step:', step)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step === stepName
                ? 'border-blue-600 bg-blue-600 text-white'
                : steps.indexOf(step as any) > index
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-500'
                }`}>
                {steps.indexOf(step as any) > index ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${step === stepName ? 'text-blue-600' : 'text-gray-500'
                }`}>
                {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
              </span>
              {index < 6 && (
                <div className={`w-4 sm:w-16 h-0.5 mx-2 sm:mx-4 ${['modules', 'destination', 'process', 'profession', 'review'].indexOf(step) > index
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
          {step === 'trade-license' ? (
            <TradeLicenseForm
              initialData={formData}
              applicationId={applicationId}
              onSaveDraft={async (submitData) => {
                // Save as DRAFT and return the ID if successful
                try {
                  const response = await fetch('/api/applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      country: 'Bangladesh',
                      processType: 'TRADE_LICENSE',
                      businessCategory: 'TRADE_LICENSE',
                      module: 'BUSINESS',
                      status: 'DRAFT', // Explicitly marking as draft
                      consultancyFee: 2000, // Explicitly provide required fee for API validation
                      answers: submitData
                    })
                  })
                  const data = await response.json()
                  if (data.success) {
                    setApplicationId(data.data.id)
                    return data.data.id
                  }
                  return null
                } catch (e) {
                  console.error('Failed to save draft:', e)
                  return null
                }
              }}
              onSubmit={handleSubmit}
              onCancel={() => setStep('category')}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 'modules' && 'Select Application Type'}
                  {step === 'destination' && 'Select Destination Country'}
                  {step === 'process' && 'Choose Process Type'}
                  {step === 'profession' && 'Select Your Profession'}
                  {step === 'review' && 'Review Application'}
                  {step === 'documents' && 'Required Documents'}
                  {step === 'call' && 'Application Submitted'}
                  {step === 'category' && 'Select Business Service'}
                </CardTitle>
                <CardDescription>
                  {step === 'modules' && 'Choose the category that best describes your purpose of travel'}
                  {step === 'category' && 'Select the specific business service you need'}
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

                {step === 'modules' && (
                  <div className="grid grid-cols-1 gap-4">
                    {MODULES.map((module) => (
                      <div
                        key={module.id}
                        className={`p-4 border rounded-lg transition-colors cursor-pointer ${selectedModule === module.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setSelectedModule(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${selectedModule === module.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <module.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{module.label}</h3>
                            </div>
                            <p className="text-sm text-gray-500">{module.description}</p>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedModule === module.id
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300 bg-white'
                              }`}>
                              {selectedModule === module.id && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step === 'category' && (
                  <div className="grid grid-cols-1 gap-4">
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <div
                        key={cat.id}
                        className={`p-4 border rounded-lg transition-colors relative ${
                          cat.comingSoon
                            ? 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                            : formData.processType === cat.id
                              ? 'cursor-pointer border-blue-500 bg-blue-50'
                              : 'cursor-pointer border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (!cat.comingSoon) setFormData(prev => ({ ...prev, processType: cat.id }))
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h3 className={`font-medium ${cat.comingSoon ? 'text-gray-400' : ''}`}>{cat.label}</h3>
                            <p className={`text-sm ${cat.comingSoon ? 'text-gray-300' : 'text-gray-500'}`}>{cat.description}</p>
                          </div>
                          {cat.comingSoon ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-200 text-gray-500 px-2.5 py-1 rounded-full whitespace-nowrap">Coming Soon</span>
                          ) : (
                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${formData.processType === cat.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                              {formData.processType === cat.id && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    {/* WorldMap */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <WorldMap
                        onCountrySelect={(country) => {
                          handleCountrySelect({
                            id: country.code.toLowerCase(), // Ensure ID format matches expectations
                            name: country.name,
                            code: country.code,
                            continent: 'Unknown', // Map component needs to provide this or we default
                            position: [0, 0, 0],
                            color: 'blue'
                          })
                        }}
                        selectedCountry={selectedCountry?.code}
                      />
                    </div>
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
                            {consultancyFees[type.value as keyof typeof consultancyFees]} BDT
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
                        <h3 className="font-medium text-gray-900 mb-2">Application Type</h3>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                          <span>{MODULES.find(m => m.id === selectedModule)?.label}</span>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <h3 className="font-medium text-gray-900 mb-2">Consultancy Fee</h3>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                          <span className="font-medium">{getCurrentFee()} BDT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 
              {step === 'documents' && applicationId && (
                <RequiredDocuments
                  applicationId={applicationId}
                  onComplete={() => setStep('call')}
                  onBack={() => setStep('review')}
                />
              )}
              */}
                {step === 'documents' && applicationId && (
                  <ComponentErrorBoundary name="RequiredDocuments">
                    <RequiredDocuments
                      applicationId={applicationId}
                      onComplete={() => setStep('call')}
                      onBack={() => setStep('review')}
                    />
                  </ComponentErrorBoundary>
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

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 'modules'}
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.processType === 'TRADE_LICENSE' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Application Type</label>
                    <p className="text-gray-900 font-medium">Trade License</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sector</label>
                    <p className="text-gray-900">Business / Commercial</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Region</label>
                    <p className="text-gray-900">Bangladesh</p>
                  </div>
                </>
              ) : (
                <>
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
                  <div>
                    <label className="text-sm font-medium text-gray-700">Application Type</label>
                    <p className="text-gray-900 hover:truncate">
                      {selectedModule ? MODULES.find(m => m.id === selectedModule)?.label : 'Not selected'}
                    </p>
                  </div>
                </>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Consultancy Fee</span>
                  <span className="font-bold text-lg text-blue-600">
                    {supportFee !== null
                      ? `${supportFee.toLocaleString()} BDT`
                      : `${getCurrentFee()} BDT`
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.processType === 'TRADE_LICENSE' ? (
                <>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submit Application</p>
                      <p className="text-xs text-gray-600">Fill details & upload documents</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-gray-600">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pay Government Fees</p>
                      <p className="text-xs text-gray-600">Calculated based on capital</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-gray-600">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Verification</p>
                      <p className="text-xs text-gray-600">Authority verifies details</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-gray-600">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Receive License</p>
                      <p className="text-xs text-gray-600">Get your digital trade license</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function NewApplicationClient() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading page...</p>
          </div>
        </div>
      }>
        <NewApplicationContent />
      </Suspense>
    </ErrorBoundary>
  )
}



