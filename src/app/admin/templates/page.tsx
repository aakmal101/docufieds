'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    documentType: '',
    country: '',
    processType: '',
  })

  useEffect(() => {
    

    
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data)
      } else {
        toast.error('Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!formData.documentType) {
      toast.error('Please select a document type')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be a PDF or Word document')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    try {
      setUploading(true)

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('documentType', formData.documentType)
      if (formData.country) {
        uploadFormData.append('country', formData.country)
      }
      if (formData.processType) {
        uploadFormData.append('processType', formData.processType)
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Template uploaded successfully')
        setFormData({ documentType: '', country: '', processType: '' })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        await fetchTemplates()
      } else {
        toast.error(data.message || 'Failed to upload template')
      }
    } catch (error) {
      console.error('Error uploading template:', error)
      toast.error('Failed to upload template')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (template: any) => {
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

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Template deleted successfully')
        await fetchTemplates()
      } else {
        toast.error(data.message || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Templates</h1>
          <p className="text-gray-600">
            Manage document templates that users can download when applying for visas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Template</CardTitle>
                <CardDescription>
                  Upload a template file for users to download
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Input
                    id="documentType"
                    placeholder="e.g., Passport, Bank Statement"
                    value={formData.documentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country (Optional)</Label>
                  <Input
                    id="country"
                    placeholder="e.g., USA, UK"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="processType">Process Type (Optional)</Label>
                  <Select 
                    value={formData.processType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, processType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select process type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOURIST">Tourist</SelectItem>
                      <SelectItem value="CONFERENCE">Conference</SelectItem>
                      <SelectItem value="MEDICAL">Medical</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="SPORTS">Sports</SelectItem>
                      <SelectItem value="VISIT">Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />

                <Button
                  onClick={handleFileSelect}
                  disabled={uploading || !formData.documentType}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX (max 10MB)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Templates List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Existing Templates</CardTitle>
                <CardDescription>
                  {templates.length} template(s) available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No templates uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload your first template using the form on the left
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-red-600" />
                              <h3 className="font-semibold text-gray-900">
                                {template.documentType}
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {template.country && (
                                <Badge variant="outline">{template.country}</Badge>
                              )}
                              {template.processType && (
                                <Badge variant="outline">{template.processType}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {template.fileName} • {(template.fileSize / 1024).toFixed(2)} KB
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Uploaded {new Date(template.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(template)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
