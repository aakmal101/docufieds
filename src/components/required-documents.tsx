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

// TEMPORARY: State timeline for debugging
if (typeof window !== 'undefined' && !(window as any).__docStateTimeline) {
  (window as any).__docStateTimeline = []
  (window as any).__lastRequirementsResponse = null
}

const logStateChange = (action: string, documentType: string, status: string | null, hasUploadedFile: boolean, details?: any) => {
  if (typeof window !== 'undefined') {
    const timeline = (window as any).__docStateTimeline
    timeline.push({
      ts: new Date().toISOString(),
      action,
      documentType,
      status,
      hasUploadedFile,
      details: details || {}
    })
    // Keep only last 50 entries
    if (timeline.length > 50) timeline.shift()
    console.log(`[STATE TIMELINE] ${action} | ${documentType} | status=${status} | hasFile=${hasUploadedFile}`, details || '')
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
  
  // CRITICAL: Lock mechanism to prevent overwriting valid uploadedFile
  // Maps documentType -> uploadedFile data that must be preserved
  const uploadLocks = useRef<Map<string, { fileUrl: string; fileName: string; uploadedAt: Date }>>(new Map())

  useEffect(() => {
    if (applicationId) {
      console.log(`[Frontend] RequiredDocuments mounted with applicationId: ${applicationId}`)
      fetchRequirements(true)
      fetchApplication()
    } else {
      console.error('[Frontend] RequiredDocuments: applicationId is missing!')
      setLoading(false)
      toast.error('Application ID is missing. Please go back and create an application first.')
    }
  }, [applicationId])

  // REMOVED: Background polling interval that was causing state reversion
  // State will be refreshed only on mount and after upload

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
      // Force no-cache to prevent stale responses
      const response = await fetch(`/api/applications/${applicationId}/requirements`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` }
        }
        console.error(`[Frontend] Requirements API error (${response.status}):`, errorData)
        throw new Error(errorData.message || `Failed to fetch requirements: ${response.status}`)
      }
      
      const data = await response.json()
      
      // CRITICAL: Validate API response structure
      if (!data || typeof data !== 'object') {
        console.error('[Frontend] Invalid API response structure:', data)
        throw new Error('Invalid response from server. Please refresh the page and try again.')
      }
      
      if (!data.success) {
        console.error('[Frontend] API returned error:', data.message)
        // If API fails, we'll use fallback documents, so don't throw here
        // Just log and let the fallback logic handle it
        console.warn('[Frontend] API returned unsuccessful response, will use fallback documents')
        throw new Error(data.message || 'Failed to fetch document requirements')
      }
      
      if (!Array.isArray(data.data)) {
        console.error('[Frontend] API data is not an array:', data.data)
        throw new Error('Invalid data format from server. Please refresh the page.')
      }
      
      if (data.data.length === 0) {
        console.warn('[Frontend] API returned empty requirements array. This may be normal for new applications.')
      }
      
      console.log(`[Frontend] Successfully fetched ${data.data.length} document requirements`)

      // TEMPORARY: Store API response for debugging
      if (typeof window !== 'undefined') {
        (window as any).__lastRequirementsResponse = JSON.parse(JSON.stringify(data))
      }

      if (data.success) {
        // TEMPORARY: Log before processing
        console.log(`[INSPECTION] fetchRequirements called | applicationId: ${applicationId} | response data length: ${data.data?.length || 0}`)
        
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
        
        // Canonical documentType normalization (must match server-side)
        const normalizeDocType = (value: string): string => {
          return value.trim().toLowerCase().replace(/\s+/g, ' ')
        }
        
        // TEMPORARY DEBUG: Log fetched requirements response
        console.log(`[Frontend] fetchRequirements response for applicationId: ${applicationId}`)
        documentsWithStatus.forEach((d, idx) => {
          console.log(`  [${idx}] Requirement: "${d.documentType}" | Status: ${d.status} | Has File: ${!!d.uploadedFile} | File URL: ${d.uploadedFile?.fileUrl?.substring(0, 60) || 'N/A'}...`)
        })
        
        // TEMPORARY: Log current state before merge
        console.log(`[INSPECTION] BEFORE merge - current documents state:`, Array.isArray(documents) ? documents.map(d => ({
          type: d.documentType,
          status: d.status,
          hasFile: !!d.uploadedFile,
          fileUrl: d.uploadedFile?.fileUrl?.substring(0, 50) || 'N/A'
        })) : [])
        
        // CRITICAL: Merge fetched data with existing state intelligently
        // NEVER overwrite valid optimistic state with stale/empty fetched data
        setDocuments(prev => {
          // TEMPORARY: Log prev state
          prev.forEach(doc => {
            logStateChange('BEFORE_MERGE', doc.documentType, doc.status, !!doc.uploadedFile, {
              fileUrl: doc.uploadedFile?.fileUrl?.substring(0, 50) || 'N/A'
            })
          })
          
          const merged = documentsWithStatus.map(fetchedDoc => {
            // Find corresponding document in current state using normalized matching
            const normalizedFetchedType = normalizeDocType(fetchedDoc.documentType)
            const currentDoc = prev.find(p => normalizeDocType(p.documentType) === normalizedFetchedType)
            
            // If current state has a valid uploaded file, preserve it unless fetched has a newer valid file
            // CRITICAL: Do NOT check status - it's a derived field that can be overwritten
            // Only check uploadedFile existence (matching button logic)
            const currentFile = currentDoc?.uploadedFile
            const fetchedFile = fetchedDoc.uploadedFile
            
            // Check if current state has valid uploadedFile (same condition as button)
            const hasValidCurrentFile = currentFile && 
                                      currentFile.fileUrl && 
                                      currentFile.fileUrl.trim().length > 0 &&
                                      currentFile.fileName && 
                                      currentFile.fileName.trim().length > 0
            
            // CRITICAL: Also check upload locks - if a documentType is locked, preserve it
            const lockedFile = uploadLocks.current.get(normalizedFetchedType)
            const hasLockedFile = lockedFile && 
                                 lockedFile.fileUrl && 
                                 lockedFile.fileUrl.trim().length > 0 &&
                                 lockedFile.fileName && 
                                 lockedFile.fileName.trim().length > 0
            
            // Use locked file if available, otherwise use current file
            const fileToPreserve = hasLockedFile ? lockedFile : (hasValidCurrentFile ? currentFile : null)
            const shouldPreserve = hasLockedFile || hasValidCurrentFile
            
            // Check if fetched has valid file (compute once)
            const hasValidFetchedFile = fetchedFile && 
                                      fetchedFile.fileUrl && 
                                      fetchedFile.fileUrl.trim().length > 0 &&
                                      fetchedFile.fileName && 
                                      fetchedFile.fileName.trim().length > 0
            
            if (shouldPreserve && fileToPreserve) {
              // CRITICAL: If fetched data doesn't have the file, preserve current/locked state
              // This handles race conditions where fetch happens before DB is updated
              
              if (!hasValidFetchedFile) {
                const preserveReason = hasLockedFile ? 'locked_file' : 'fetched_missing_file'
                console.log(`[Frontend] ✓ Preserving ${preserveReason} for "${fetchedDoc.documentType}" - fetched data missing file`)
                logStateChange('MERGE_PRESERVE', fetchedDoc.documentType, 'uploaded', true, {
                  reason: preserveReason,
                  fileUrl: fileToPreserve.fileUrl.substring(0, 50)
                })
                return {
                  ...fetchedDoc,
                  status: 'uploaded' as const,
                  uploadedFile: fileToPreserve
                }
              }
              
              // If both have files, use the one with newer upload date
              if (fetchedFile.uploadedAt && fileToPreserve.uploadedAt) {
                const preserveDate = fileToPreserve.uploadedAt instanceof Date ? fileToPreserve.uploadedAt : new Date(fileToPreserve.uploadedAt)
                const fetchedDate = fetchedFile.uploadedAt instanceof Date ? fetchedFile.uploadedAt : new Date(fetchedFile.uploadedAt)
                
                if (preserveDate > fetchedDate) {
                  console.log(`[Frontend] ✓ Using newer ${hasLockedFile ? 'locked' : 'local'} state for "${fetchedDoc.documentType}" (preserve: ${preserveDate.toISOString()}, fetched: ${fetchedDate.toISOString()})`)
                  logStateChange('MERGE_PRESERVE_NEWER', fetchedDoc.documentType, 'uploaded', true, {
                    reason: 'newer_date',
                    fileUrl: fileToPreserve.fileUrl.substring(0, 50)
                  })
                  return {
                    ...fetchedDoc,
                    status: 'uploaded' as const,
                    uploadedFile: fileToPreserve
                  }
                }
              }
            }
            
            // CRITICAL: Check locks even if current state doesn't have file
            // This handles case where state was overwritten but lock still exists
            if (hasLockedFile && !hasValidFetchedFile) {
              console.log(`[Frontend] ✓ CRITICAL: Restoring from lock for "${fetchedDoc.documentType}" - state was overwritten`)
              logStateChange('MERGE_RESTORE_LOCK', fetchedDoc.documentType, 'uploaded', true, {
                reason: 'restore_from_lock',
                fileUrl: lockedFile.fileUrl.substring(0, 50)
              })
              return {
                ...fetchedDoc,
                status: 'uploaded' as const,
                uploadedFile: lockedFile
              }
            }
            
            // Final check: if we have a lock or current file but fetched doesn't, preserve
            const finalFileToPreserve = hasLockedFile ? lockedFile : (hasValidCurrentFile ? currentFile : null)
            if (finalFileToPreserve && !hasValidFetchedFile) {
              const preserveReason = hasLockedFile ? 'locked_file' : 'current_file'
              console.log(`[Frontend] ✓ CRITICAL: Preserving ${preserveReason} for "${fetchedDoc.documentType}" - fetched has no file`)
              logStateChange('MERGE_PRESERVE_FINAL', fetchedDoc.documentType, 'uploaded', true, {
                reason: preserveReason,
                fileUrl: finalFileToPreserve.fileUrl.substring(0, 50)
              })
              return {
                ...fetchedDoc,
                status: 'uploaded' as const,
                uploadedFile: finalFileToPreserve
              }
            }
            
            // If fetched has valid file, use it and clear lock (database confirmed)
            if (hasValidFetchedFile) {
              // Clear lock since database has confirmed the file
              uploadLocks.current.delete(normalizedFetchedType)
              console.log(`[Frontend] ✓ Using fetched data for "${fetchedDoc.documentType}" (lock cleared)`)
              logStateChange('MERGE_USE_FETCHED', fetchedDoc.documentType, fetchedDoc.status, true, {
                fileUrl: fetchedDoc.uploadedFile.fileUrl.substring(0, 50)
              })
              return fetchedDoc
            }
            
            // If neither has file, use fetched (it's the source of truth)
            logStateChange('MERGE_NO_FILE', fetchedDoc.documentType, fetchedDoc.status, false, {
              source: 'fetched'
            })
            return fetchedDoc
          })
          
          // TEMPORARY: Log final merged state
          merged.forEach(doc => {
            logStateChange('AFTER_MERGE', doc.documentType, doc.status, !!doc.uploadedFile, {
              fileUrl: doc.uploadedFile?.fileUrl?.substring(0, 50) || 'N/A'
            })
          })
          
          return merged
        })
        
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
        // CRITICAL: Merge fallback with existing state to preserve any uploaded files
        setDocuments(prev => {
          // If we have existing documents with uploaded files, preserve them
          if (prev.length > 0) {
            const merged = fallbackDocuments.map(fallbackDoc => {
              const existingDoc = prev.find(p => 
                normalizeDocType(p.documentType) === normalizeDocType(fallbackDoc.documentType)
              )
              
              // If existing doc has uploaded file, preserve it
              if (existingDoc?.uploadedFile && 
                  existingDoc.uploadedFile.fileUrl && 
                  existingDoc.uploadedFile.fileUrl.trim().length > 0) {
                return {
                  ...fallbackDoc,
                  status: 'uploaded' as const,
                  uploadedFile: existingDoc.uploadedFile
                }
              }
              
              return fallbackDoc
            })
            return merged
          }
          
          return fallbackDocuments
        })
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

      console.log(`[Frontend] Starting upload: documentType="${documentType}", fileName="${file.name}", size=${file.size}, applicationId="${applicationId}"`)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      // Get response text first to handle both JSON and text errors
      const responseText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText || `Upload failed with status ${response.status}` }
      }

      if (!response.ok) {
        const errorMessage = errorData.message || `Upload failed with status ${response.status}`
        console.error(`[Frontend] Upload failed (${response.status}): ${errorMessage}`, errorData)
        throw new Error(errorMessage)
      }

      // Parse successful response
      const data = JSON.parse(responseText)

      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('[Frontend] Invalid upload response structure:', data)
        throw new Error('Invalid response from server')
      }

      if (!data.success) {
        console.error('[Frontend] Upload API returned error:', data.message)
        throw new Error(data.message || 'Upload failed')
      }

      if (!data.data) {
        console.error('[Frontend] Upload response missing data:', data)
        throw new Error('Upload response missing document data')
      }

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
        const uploadedFile = {
          fileUrl: uploadedFileData.fileUrl.trim(),
          fileName: uploadedFileData.fileName.trim(),
          uploadedAt: uploadedFileData.uploadedAt instanceof Date 
            ? uploadedFileData.uploadedAt 
            : new Date(uploadedFileData.uploadedAt)
        }
        
        // TEMPORARY DEBUG: Log upload success with all details
        console.log(`[Frontend] ✓ Upload SUCCESS:`)
        console.log(`  - applicationId: ${applicationId}`)
        console.log(`  - requirement.documentType: "${documentType}"`)
        console.log(`  - returned document.documentType: "${documentData.documentType || 'N/A'}"`)
        console.log(`  - returned fileUrl: ${uploadedFile.fileUrl.substring(0, 80)}...`)
        console.log(`  - returned fileName: "${uploadedFile.fileName}"`)
        console.log(`  - uploadedAt: ${uploadedFile.uploadedAt.toISOString()}`)
        
        // Canonical normalization for matching
        const normalizeDocType = (value: string): string => {
          return value.trim().toLowerCase().replace(/\s+/g, ' ')
        }
        
        // TEMPORARY: Log before optimistic update
        console.log(`[INSPECTION] BEFORE optimistic update - current state:`, Array.isArray(documents) ? documents.map(d => ({
          type: d.documentType,
          status: d.status,
          hasFile: !!d.uploadedFile
        })) : [])
        
        // CRITICAL: Lock this uploadedFile to prevent overwrite
        const normalizedType = normalizeDocType(documentType)
        uploadLocks.current.set(normalizedType, uploadedFile)
        console.log(`[Frontend] ✓ Locked uploadedFile for "${documentType}" (normalized: "${normalizedType}")`)
        
        setDocuments(prev => {
          const updated = prev.map(doc => {
            // Use normalized matching to find the correct document
            if (normalizeDocType(doc.documentType) === normalizedType) {
              console.log(`[Frontend] ✓ Updating state for "${doc.documentType}" → "uploaded"`)
              logStateChange('OPTIMISTIC_UPDATE', doc.documentType, 'uploaded', true, {
                fileUrl: uploadedFile.fileUrl.substring(0, 50),
                fileName: uploadedFile.fileName
              })
              return {
                ...doc,
                status: 'uploaded' as const,
                uploadedFile
              }
            }
            return doc
          })
          
          // TEMPORARY: Log after optimistic update
          updated.forEach(doc => {
            if (normalizeDocType(doc.documentType) === normalizedType) {
              logStateChange('AFTER_OPTIMISTIC', doc.documentType, doc.status, !!doc.uploadedFile, {
                fileUrl: doc.uploadedFile?.fileUrl?.substring(0, 50) || 'N/A'
              })
            }
          })
          
          return updated
        })

        toast.success(`${documentType} uploaded successfully!`, {
          duration: 3000,
          icon: '✅',
        })
        
        // Reset file input immediately
        if (fileInputRefs.current[documentType]) {
          fileInputRefs.current[documentType].value = ''
        }
        
        console.log(`[Frontend] ✓ Upload complete for "${documentType}". State updated, verification will run in background.`)

        // TEMPORARY: Log before fetchRequirements call
        console.log(`[INSPECTION] About to call fetchRequirements(false) after upload`)
        logStateChange('BEFORE_FETCH_REQUIREMENTS', documentType, 'uploaded', true, {
          action: 'calling fetchRequirements after upload'
        })
        
        // CRITICAL: Verify document was saved before refreshing
        // Add a small delay to ensure database write has propagated
        // Then verify the document exists before refreshing
        const verifyAndRefresh = async () => {
          try {
            // Wait a moment for DB write to propagate
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Verify document exists in database
            const verifyResponse = await fetch(`/api/documents?applicationId=${applicationId}&documentType=${encodeURIComponent(documentType)}`, {
              cache: 'no-store'
            })
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              if (verifyData.success && verifyData.data && verifyData.data.length > 0) {
                const savedDoc = verifyData.data.find((d: any) => 
                  normalizeDocType(d.documentType) === normalizeDocType(documentType)
                )
                
                if (savedDoc && savedDoc.fileUrl && savedDoc.fileUrl.trim().length > 0) {
                  console.log(`[Frontend] ✓ Document verified in database, refreshing requirements`)
                  logStateChange('VERIFICATION_SUCCESS', documentType, 'uploaded', true, {
                    fileUrl: savedDoc.fileUrl.substring(0, 50)
                  })
                  // Clear lock since database confirmed the document
                  const normalizedType = normalizeDocType(documentType)
                  uploadLocks.current.delete(normalizedType)
                  console.log(`[Frontend] ✓ Lock cleared for "${documentType}" - database confirmed`)
                  await fetchRequirements(false)
                  return
                }
              }
            }
            
            // If verification failed, still refresh (merge logic will preserve)
            console.log(`[Frontend] ⚠ Document verification inconclusive, refreshing anyway`)
            logStateChange('VERIFICATION_INCONCLUSIVE', documentType, 'unknown', true, {
              action: 'refreshing_anyway'
            })
            await fetchRequirements(false)
          } catch (err) {
            console.warn('[Frontend] Verification/refresh failed:', err)
            logStateChange('VERIFICATION_ERROR', documentType, 'error', false, {
              error: err instanceof Error ? err.message : 'unknown'
            })
            // Don't show error to user - we already have the correct state
          }
        }
        
        // Start verification in background
        verifyAndRefresh()
      } else {
        throw new Error(data.message || 'Failed to upload document')
      }
    } catch (error: any) {
      console.error('[Frontend] Upload error:', error)
      const errorMessage = error.message || 'Failed to upload document. Please try again.'
      
      // Provide user-friendly error messages
      let userMessage = errorMessage
      if (errorMessage.includes('Storage bucket not configured')) {
        userMessage = 'Storage is not configured. Please contact support.'
      } else if (errorMessage.includes('Permission denied')) {
        userMessage = 'You do not have permission to upload documents. Please contact support.'
      } else if (errorMessage.includes('already exists')) {
        userMessage = 'A file with this name already exists. Please rename your file and try again.'
      }
      
      toast.error(userMessage, {
        duration: 5000,
        icon: '❌',
      })
      
      // Clear lock on error
      const normalizedType = normalizeDocType(documentType)
      uploadLocks.current.delete(normalizedType)
      console.log(`[Frontend] ✓ Lock cleared for "${documentType}" - upload failed`)
      
      // Re-fetch to ensure state is correct after error
      // This ensures we don't show stale "uploaded" state if upload failed
      try {
        await fetchRequirements(false)
      } catch (fetchError) {
        console.error('[Frontend] Error refreshing requirements after upload failure:', fetchError)
      }
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }))
      console.log(`[Frontend] Upload process completed for "${documentType}"`)
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
                      // SOURCE OF TRUTH: uploadedFile existence determines button state
                      // A document is uploaded IF AND ONLY IF:
                      // 1. uploadedFile exists
                      // 2. fileUrl is valid (non-empty string)
                      // 3. fileName is valid (non-empty string)
                      // NOTE: Do NOT check document.status - it's a derived field that can be overwritten
                      const uploadedFile = document.uploadedFile
                      const hasUploadedDocument = uploadedFile && 
                                                uploadedFile.fileUrl && 
                                                uploadedFile.fileUrl.trim().length > 0 &&
                                                uploadedFile.fileName && 
                                                uploadedFile.fileName.trim().length > 0
                      
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
                      // SOURCE OF TRUTH: uploadedFile existence determines button state
                      // A document is uploaded IF AND ONLY IF:
                      // 1. uploadedFile exists
                      // 2. fileUrl is valid (non-empty string)
                      // 3. fileName is valid (non-empty string)
                      // NOTE: Do NOT check document.status - it's a derived field that can be overwritten
                      const uploadedFile = document.uploadedFile
                      const hasUploadedDocument = uploadedFile && 
                                                uploadedFile.fileUrl && 
                                                uploadedFile.fileUrl.trim().length > 0 &&
                                                uploadedFile.fileName && 
                                                uploadedFile.fileName.trim().length > 0
                      
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
