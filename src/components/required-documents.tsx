'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, FileText, Download, AlertCircle, Upload, Loader2, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface DocumentRequirement {
  id: string
  documentType: string
  description: string | null
  isRequired: boolean
  status: 'pending' | 'uploaded'
  uploadedFile?: {
    fileUrl: string
    fileName: string
    uploadedAt: Date
  } | null
}

interface RequiredDocumentsProps {
  applicationId: string
  onComplete: () => void
  onBack: () => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'uploaded':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'uploaded':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export default function RequiredDocuments({ applicationId, onComplete, onBack }: RequiredDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
  const [templates, setTemplates] = useState<{ [key: string]: any }>({})
  const [viewingDocument, setViewingDocument] = useState<{ url: string; fileName: string } | null>(null)
  const [application, setApplication] = useState<any>(null)
  const [checkingReadiness, setCheckingReadiness] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    if (applicationId) {
      fetchRequirements(true)
      fetchApplication()
    } else {
      setLoading(false)
      toast.error('Application ID is missing')
    }
  }, [applicationId])

  // Refresh requirements periodically to catch any external updates
  // This ensures state stays in sync with database
  useEffect(() => {
    if (!applicationId) return

    const interval = setInterval(() => {
      // Silently refresh every 30 seconds to keep state in sync
      fetchRequirements(false).catch(err => {
        console.warn('Background refresh failed:', err)
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      const data = await response.json()
      if (data.success) {
        setApplication(data.data)
      }
    } catch (error) {
      console.error('Error fetching application:', error)
    }
  }

  const fetchRequirements = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const response = await fetch(`/api/applications/${applicationId}/requirements`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success) {
        // This is the SOURCE OF TRUTH - data comes directly from the database
        // Map requirements with their upload status from database
        const documentsWithStatus = (data.data || []).map((doc: any) => {
          // CRITICAL: Check if document has valid uploaded file data
          // Database is the source of truth - if uploadedFile exists with valid data, document is uploaded
          const uploadedFile = doc.uploadedFile
          const hasUploadedFile = uploadedFile && 
                                 uploadedFile.fileUrl && 
                                 uploadedFile.fileUrl.trim().length > 0 &&
                                 uploadedFile.fileName && 
                                 uploadedFile.fileName.trim().length > 0
          
          return {
            ...doc,
            // Status is determined by database record existence
            status: hasUploadedFile ? 'uploaded' as const : 'pending' as const,
            uploadedFile: hasUploadedFile ? {
              fileUrl: uploadedFile.fileUrl.trim(),
              fileName: uploadedFile.fileName.trim(),
              uploadedAt: uploadedFile.uploadedAt 
                ? (uploadedFile.uploadedAt instanceof Date 
                    ? uploadedFile.uploadedAt 
                    : new Date(uploadedFile.uploadedAt))
                : new Date()
            } : null
          }
        })
        
        // Only update state if we have valid data
        // This prevents overwriting optimistic updates with stale data
        if (documentsWithStatus.length > 0) {
          setDocuments(documentsWithStatus)
        }
        
        // Fetch templates for each document type (only if we have documents)
        if (data.data && data.data.length > 0) {
          const templatePromises = data.data.map(async (doc: DocumentRequirement) => {
            try {
              const templateResponse = await fetch(
                `/api/templates?documentType=${encodeURIComponent(doc.documentType)}`
              )
              if (templateResponse.ok) {
                const templateData = await templateResponse.json()
                if (templateData.success && templateData.data.length > 0) {
                  return { [doc.documentType]: templateData.data[0] }
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch template for ${doc.documentType}:`, err)
            }
            return null
          })
          const templateResults = await Promise.all(templatePromises)
          const templateMap: { [key: string]: any } = {}
          templateResults.forEach((result) => {
            if (result) {
              Object.assign(templateMap, result)
            }
          })
          setTemplates(templateMap)
        }
      } else {
        console.error('API returned error:', data.message)
        // Show fallback default documents if API fails
        const fallbackDocuments: DocumentRequirement[] = [
          {
            id: '1',
            documentType: 'Passport',
            description: 'Valid passport with at least 6 months validity',
            isRequired: true,
            status: 'pending',
            uploadedFile: null,
          },
          {
            id: '2',
            documentType: 'National ID Card',
            description: 'Government-issued national identification card',
            isRequired: true,
            status: 'pending',
            uploadedFile: null,
          },
          {
            id: '3',
            documentType: 'Birth Certificate',
            description: 'Official birth certificate with apostille',
            isRequired: true,
            status: 'pending',
            uploadedFile: null,
          },
          {
            id: '4',
            documentType: 'Bank Statements',
            description: 'Last 6 months bank statements showing sufficient funds',
            isRequired: true,
            status: 'pending',
            uploadedFile: null,
          },
          {
            id: '5',
            documentType: 'Employment Letter',
            description: 'Letter from employer confirming employment and salary',
            isRequired: true,
            status: 'pending',
            uploadedFile: null,
          },
          {
            id: '6',
            documentType: 'Travel Insurance',
            description: 'Comprehensive travel insurance coverage',
            isRequired: true,
            status: 'pending',
            uploadedFile: null,
          },
        ]
        setDocuments(fallbackDocuments)
        // Try to fetch templates for fallback documents
        const templatePromises = fallbackDocuments.map(async (doc) => {
          try {
            const templateResponse = await fetch(
              `/api/templates?documentType=${encodeURIComponent(doc.documentType)}`
            )
            if (templateResponse.ok) {
              const templateData = await templateResponse.json()
              if (templateData.success && templateData.data.length > 0) {
                return { [doc.documentType]: templateData.data[0] }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch template for ${doc.documentType}:`, err)
          }
          return null
        })
        const templateResults = await Promise.all(templatePromises)
        const templateMap: { [key: string]: any } = {}
        templateResults.forEach((result) => {
          if (result) {
            Object.assign(templateMap, result)
          }
        })
        setTemplates(templateMap)
        // Don't show error toast - fallback is expected behavior
        console.warn('Using fallback documents. API returned error:', data.message)
      }
    } catch (error) {
      console.error('Error fetching requirements:', error)
      // Show fallback default documents on error
      const fallbackDocuments: DocumentRequirement[] = [
        {
          id: '1',
          documentType: 'Passport',
          description: 'Valid passport with at least 6 months validity',
          isRequired: true,
          status: 'pending',
          uploadedFile: null,
        },
        {
          id: '2',
          documentType: 'National ID Card',
          description: 'Government-issued national identification card',
          isRequired: true,
          status: 'pending',
          uploadedFile: null,
        },
        {
          id: '3',
          documentType: 'Birth Certificate',
          description: 'Official birth certificate with apostille',
          isRequired: true,
          status: 'pending',
          uploadedFile: null,
        },
        {
          id: '4',
          documentType: 'Bank Statements',
          description: 'Last 6 months bank statements showing sufficient funds',
          isRequired: true,
          status: 'pending',
          uploadedFile: null,
        },
        {
          id: '5',
          documentType: 'Employment Letter',
          description: 'Letter from employer confirming employment and salary',
          isRequired: true,
          status: 'pending',
          uploadedFile: null,
        },
        {
          id: '6',
          documentType: 'Travel Insurance',
          description: 'Comprehensive travel insurance coverage',
          isRequired: true,
          status: 'pending',
          uploadedFile: null,
        },
      ]
      setDocuments(fallbackDocuments)
      // Try to fetch templates for fallback documents
      const templatePromises = fallbackDocuments.map(async (doc) => {
        try {
          const templateResponse = await fetch(
            `/api/templates?documentType=${encodeURIComponent(doc.documentType)}`
          )
          if (templateResponse.ok) {
            const templateData = await templateResponse.json()
            if (templateData.success && templateData.data.length > 0) {
              return { [doc.documentType]: templateData.data[0] }
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch template for ${doc.documentType}:`, err)
        }
        return null
      })
      const templateResults = await Promise.all(templatePromises)
      const templateMap: { [key: string]: any } = {}
      templateResults.forEach((result) => {
        if (result) {
          Object.assign(templateMap, result)
        }
      })
      setTemplates(templateMap)
      // Don't show error toast for fallback - it's expected behavior
      console.warn('Using fallback documents. API may have failed or no requirements exist yet.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async (documentType: string) => {
    const template = templates[documentType]
    if (!template) {
      toast.error('Template not available for this document type')
      return
    }

    try {
      const response = await fetch(`/api/templates/${template.id}/download`)
      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = template.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Template downloaded successfully')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  const handleFileSelect = (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX files.')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    handleUpload(documentType, file)
  }

  const handleUpload = async (documentType: string, file: File) => {
    try {
      setUploading(prev => ({ ...prev, [documentType]: true }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('applicationId', applicationId)
      formData.append('documentType', documentType)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        // The API returns the saved document from database (SOURCE OF TRUTH)
        const documentData = data.data
        
        // Extract file data - API returns both formats for compatibility
        const uploadedFileData = documentData.uploadedFile || {
          fileUrl: documentData.fileUrl,
          fileName: documentData.fileName,
          uploadedAt: documentData.uploadedAt || new Date()
        }
        
        // CRITICAL: Validate we have valid file data from database
        if (!uploadedFileData.fileUrl || !uploadedFileData.fileName || 
            uploadedFileData.fileUrl.trim().length === 0 || 
            uploadedFileData.fileName.trim().length === 0) {
          console.error('Invalid document data from server:', documentData)
          throw new Error('Invalid document data received from server. Please try again.')
        }

        // Update state with the CONFIRMED database record
        // This is the source of truth - the document exists in the database
        setDocuments(prev => prev.map(doc => {
          if (doc.documentType === documentType) {
            return {
              ...doc,
              status: 'uploaded' as const,
              uploadedFile: {
                fileUrl: uploadedFileData.fileUrl.trim(),
                fileName: uploadedFileData.fileName.trim(),
                uploadedAt: uploadedFileData.uploadedAt instanceof Date 
                  ? uploadedFileData.uploadedAt 
                  : new Date(uploadedFileData.uploadedAt)
              }
            }
          }
          return doc
        }))

        toast.success(`${documentType} uploaded successfully`)
        
        // Reset file input immediately
        if (fileInputRefs.current[documentType]) {
          fileInputRefs.current[documentType].value = ''
        }

        // Refresh from server after a short delay to ensure database consistency
        // This ensures the state stays in sync, but doesn't overwrite our confirmed update
        setTimeout(async () => {
          try {
            await fetchRequirements(false)
          } catch (err) {
            console.warn('Background refresh after upload failed:', err)
            // Don't show error to user - we already have the correct state
          }
        }, 500)
      } else {
        throw new Error(data.message || 'Failed to upload document')
      }
    } catch (error: any) {
      console.error('Error uploading document:', error)
      toast.error(error.message || 'Failed to upload document. Please try again.')
      
      // Re-fetch to ensure state is correct after error
      // This ensures we don't show stale "uploaded" state if upload failed
      try {
        await fetchRequirements(false)
      } catch (fetchError) {
        console.error('Error refreshing requirements after upload failure:', fetchError)
      }
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }))
    }
  }

  const handleViewDocument = async (fileUrl: string, fileName: string) => {
    // Validate URL before opening
    if (!fileUrl || fileUrl.trim().length === 0) {
      toast.error('Document URL is invalid. Please try uploading again.')
      // Refresh to get correct state
      await fetchRequirements(false)
      return
    }

    // Check if URL is accessible (basic validation)
    try {
      // For Supabase public URLs, we can directly use them
      // For other URLs, we might need to verify
      setViewingDocument({ url: fileUrl, fileName })
    } catch (error) {
      console.error('Error opening document:', error)
      toast.error('Unable to open document. Please try again.')
    }
  }

  const closeViewer = () => {
    setViewingDocument(null)
  }

  const handleContinueToCallPhase = async () => {
    if (!applicationId) {
      toast.error('Application ID not found')
      return
    }

    setCheckingReadiness(true)

    try {
      // Check if application is ready (documents + payment)
      const response = await fetch(`/api/applications/${applicationId}/complete-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        // Status transition successful, proceed to Call Phase
        toast.success('Application ready! Proceeding to final step.')
        onComplete()
      } else {
        // Handle validation errors
        if (data.missingDocuments) {
          const missingList = data.missingDocuments.map((d: any) => d.documentType).join(', ')
          toast.error(`Please upload all required documents: ${missingList}`, {
            duration: 5000,
          })
        } else if (data.requiredAmount) {
          toast.error(`Payment required: ${data.requiredAmount} BDT. Please complete payment before proceeding.`, {
            duration: 5000,
          })
        } else {
          toast.error(data.message || 'Please complete all requirements before proceeding.')
        }
      }
    } catch (error: any) {
      console.error('Error checking readiness:', error)
      toast.error('Failed to verify application readiness. Please try again.')
    } finally {
      setCheckingReadiness(false)
    }
  }

  const requiredDocuments = documents.filter(doc => doc.isRequired)
  const optionalDocuments = documents.filter(doc => !doc.isRequired)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="ml-3 text-gray-600">Loading document requirements...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Required Documents</h1>
        <p className="text-gray-600">
          Please prepare the following documents for your visa application. 
          Required documents are mandatory, while supporting documents are optional but recommended.
        </p>
      </div>

      {/* Required Documents */}
      {requiredDocuments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            Required Documents ({requiredDocuments.length})
          </h2>
          <div className="grid gap-4">
            {requiredDocuments.map((document) => (
              <Card key={document.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 text-red-600 mr-2" />
                      {document.documentType}
                    </CardTitle>
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{document.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {document.description || 'No description available'}
                  </p>
                  {document.uploadedFile && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Uploaded: {document.uploadedFile.fileName}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadTemplate(document.documentType)}
                      disabled={!templates[document.documentType]}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Template
                    </Button>
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[document.documentType] = el)}
                      onChange={(e) => handleFileSelect(document.documentType, e)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                    />
                    {(() => {
                      // SOURCE OF TRUTH: Database record determines button state
                      // A document is uploaded ONLY if:
                      // 1. uploadedFile exists
                      // 2. fileUrl is valid (non-empty string)
                      // 3. fileName is valid (non-empty string)
                      const uploadedFile = document.uploadedFile
                      const hasUploadedDocument = uploadedFile && 
                                                uploadedFile.fileUrl && 
                                                uploadedFile.fileUrl.trim().length > 0 &&
                                                uploadedFile.fileName && 
                                                uploadedFile.fileName.trim().length > 0 &&
                                                document.status === 'uploaded'
                      
                      if (hasUploadedDocument) {
                        return (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleViewDocument(uploadedFile.fileUrl, uploadedFile.fileName)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Document
                          </Button>
                        )
                      }
                      
                      return (
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => fileInputRefs.current[document.documentType]?.click()}
                          disabled={uploading[document.documentType]}
                        >
                          {uploading[document.documentType] ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Document
                            </>
                          )}
                        </Button>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Optional Documents */}
      {optionalDocuments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            Supporting Documents ({optionalDocuments.length})
          </h2>
          <div className="grid gap-4">
            {optionalDocuments.map((document) => (
              <Card key={document.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      {document.documentType}
                    </CardTitle>
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{document.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {document.description || 'No description available'}
                  </p>
                  {document.uploadedFile && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Uploaded: {document.uploadedFile.fileName}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadTemplate(document.documentType)}
                      disabled={!templates[document.documentType]}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Template
                    </Button>
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[document.documentType] = el)}
                      onChange={(e) => handleFileSelect(document.documentType, e)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                    />
                    {(() => {
                      // SOURCE OF TRUTH: Database record determines button state
                      // A document is uploaded ONLY if:
                      // 1. uploadedFile exists
                      // 2. fileUrl is valid (non-empty string)
                      // 3. fileName is valid (non-empty string)
                      const uploadedFile = document.uploadedFile
                      const hasUploadedDocument = uploadedFile && 
                                                uploadedFile.fileUrl && 
                                                uploadedFile.fileUrl.trim().length > 0 &&
                                                uploadedFile.fileName && 
                                                uploadedFile.fileName.trim().length > 0 &&
                                                document.status === 'uploaded'
                      
                      if (hasUploadedDocument) {
                        return (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleViewDocument(uploadedFile.fileUrl, uploadedFile.fileName)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Document
                          </Button>
                        )
                      }
                      
                      return (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => fileInputRefs.current[document.documentType]?.click()}
                          disabled={uploading[document.documentType]}
                        >
                          {uploading[document.documentType] ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Document
                            </>
                          )}
                        </Button>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No document requirements found for this application.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact support if you believe this is an error.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="bg-red-600 hover:bg-red-700"
          onClick={handleContinueToCallPhase}
          disabled={checkingReadiness}
        >
          {checkingReadiness ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Continue to Next Step'
          )}
        </Button>
      </div>

      {/* PDF Viewer Modal */}
      {viewingDocument && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              closeViewer()
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center truncate flex-1 mr-4">
                <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="truncate">{viewingDocument.fileName}</span>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeViewer}
                className="flex-shrink-0"
                aria-label="Close document viewer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {(() => {
                const url = viewingDocument.url.toLowerCase()
                const fileName = viewingDocument.fileName.toLowerCase()
                
                // Determine file type
                const isPDF = fileName.endsWith('.pdf') || 
                             url.includes('.pdf') || 
                             url.includes('application/pdf') ||
                             url.includes('content-type=application/pdf')
                
                const isImage = fileName.endsWith('.jpg') || 
                              fileName.endsWith('.jpeg') || 
                              fileName.endsWith('.png') || 
                              fileName.endsWith('.gif') ||
                              url.includes('image/jpeg') ||
                              url.includes('image/png') ||
                              url.includes('image/jpg')
                
                if (isPDF) {
                  return (
                    <div className="w-full h-full flex flex-col">
                      <iframe
                        src={`${viewingDocument.url}#toolbar=1`}
                        className="w-full flex-1 border-0 min-h-[600px]"
                        title={viewingDocument.fileName}
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  )
                }
                
                if (isImage) {
                  return (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <div className="text-center w-full">
                        <img
                          src={viewingDocument.url}
                          alt={viewingDocument.fileName}
                          className="max-w-full max-h-[75vh] mx-auto rounded-lg shadow-lg"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            const container = target.parentElement
                            if (container) {
                              target.style.display = 'none'
                              const errorDiv = container.querySelector('.image-error') as HTMLElement
                              if (errorDiv) errorDiv.style.display = 'block'
                            }
                          }}
                        />
                        <div className="image-error mt-4" style={{ display: 'none' }}>
                          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 mb-2">Unable to display this image</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(viewingDocument.url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download to View
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                // For other file types, show download option
                return (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Preview not available for this file type</p>
                      <p className="text-sm text-gray-500 mb-4">{viewingDocument.fileName}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(viewingDocument.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download to View
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    window.open(viewingDocument.url, '_blank', 'noopener,noreferrer')
                  } catch (error) {
                    console.error('Error opening document:', error)
                    toast.error('Unable to open document in new tab')
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button onClick={closeViewer}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
