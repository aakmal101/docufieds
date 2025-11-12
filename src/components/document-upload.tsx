'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Loader2
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DocumentUploadProps {
  applicationId: string
  documentRequirements: string[]
  onUploadComplete?: () => void
}

interface UploadedFile {
  id: string
  file: File
  documentType: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export default function DocumentUpload({ 
  applicationId, 
  documentRequirements,
  onUploadComplete 
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      documentType: '',
      progress: 0,
      status: 'uploading'
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      simulateUpload(uploadedFile.id)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const simulateUpload = async (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId && file.progress < 100) {
          const newProgress = Math.min(file.progress + Math.random() * 30, 100)
          return { ...file, progress: newProgress }
        }
        return file
      }))
    }, 200)

    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval)
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return { ...file, status: 'completed', progress: 100 }
        }
        return file
      }))
      
      // Call API to save document
      saveDocument(fileId)
    }, 2000)
  }

  const saveDocument = async (fileId: string) => {
    const uploadedFile = uploadedFiles.find(f => f.id === fileId)
    if (!uploadedFile) return

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile.file)
      formData.append('applicationId', applicationId)
      formData.append('documentType', uploadedFile.documentType)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${uploadedFile.file.name} uploaded successfully`)
        if (onUploadComplete) {
          onUploadComplete()
        }
      } else {
        setUploadedFiles(prev => prev.map(file => {
          if (file.id === fileId) {
            return { ...file, status: 'error', error: data.message }
          }
          return file
        }))
        toast.error(`Failed to upload ${uploadedFile.file.name}`)
      }
    } catch (error) {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return { ...file, status: 'error', error: 'Upload failed' }
        }
        return file
      }))
      toast.error(`Failed to upload ${uploadedFile.file.name}`)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const setDocumentType = (fileId: string, documentType: string) => {
    setUploadedFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return { ...file, documentType }
      }
      return file
    }))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️'
      case 'doc':
      case 'docx':
        return '📝'
      default:
        return '📁'
    }
  }

  return (
    <div className="space-y-6">
      {/* Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            Upload the following documents for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {documentRequirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{requirement}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop files here, or click to select files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, JPG, PNG, DOC, DOCX (max 10MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Manage your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(uploadedFile.file.name)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadedFile.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {uploadedFile.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {uploadedFile.status === 'uploading' && (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Document Type Selection */}
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Document Type
                    </label>
                    <select
                      value={uploadedFile.documentType}
                      onChange={(e) => setDocumentType(uploadedFile.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select document type</option>
                      {documentRequirements.map((requirement) => (
                        <option key={requirement} value={requirement}>
                          {requirement}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Progress Bar */}
                  {uploadedFile.status === 'uploading' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadedFile.progress)}%</span>
                      </div>
                      <Progress value={uploadedFile.progress} className="h-2" />
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadedFile.status === 'error' && uploadedFile.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {uploadedFile.error}
                    </div>
                  )}

                  {/* Success Message */}
                  {uploadedFile.status === 'completed' && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      File uploaded successfully
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}














