'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, FileText, Download, AlertCircle } from 'lucide-react'

interface Document {
  id: string
  name: string
  description: string
  required: boolean
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  category: 'identity' | 'financial' | 'travel' | 'supporting'
}

interface RequiredDocumentsProps {
  onComplete: () => void
  onBack: () => void
}

const dummyDocuments: Document[] = [
  {
    id: '1',
    name: 'Passport',
    description: 'Valid passport with at least 6 months validity',
    required: true,
    status: 'pending',
    category: 'identity'
  },
  {
    id: '2',
    name: 'National ID Card',
    description: 'Government-issued national identification card',
    required: true,
    status: 'pending',
    category: 'identity'
  },
  {
    id: '3',
    name: 'Birth Certificate',
    description: 'Official birth certificate with apostille',
    required: true,
    status: 'pending',
    category: 'identity'
  },
  {
    id: '4',
    name: 'Bank Statements',
    description: 'Last 6 months bank statements showing sufficient funds',
    required: true,
    status: 'pending',
    category: 'financial'
  },
  {
    id: '5',
    name: 'Employment Letter',
    description: 'Letter from employer confirming employment and salary',
    required: true,
    status: 'pending',
    category: 'financial'
  },
  {
    id: '6',
    name: 'Travel Insurance',
    description: 'Comprehensive travel insurance coverage',
    required: true,
    status: 'pending',
    category: 'travel'
  },
  {
    id: '7',
    name: 'Accommodation Proof',
    description: 'Hotel booking or accommodation confirmation',
    required: false,
    status: 'pending',
    category: 'supporting'
  },
  {
    id: '8',
    name: 'Educational Certificates',
    description: 'Academic certificates and transcripts',
    required: false,
    status: 'pending',
    category: 'supporting'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'uploaded':
      return 'bg-blue-100 text-blue-800'
    case 'verified':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'uploaded':
      return <FileText className="h-4 w-4" />
    case 'verified':
      return <CheckCircle className="h-4 w-4" />
    case 'rejected':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'identity':
      return 'bg-red-100 text-red-800'
    case 'financial':
      return 'bg-green-100 text-green-800'
    case 'travel':
      return 'bg-blue-100 text-blue-800'
    case 'supporting':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function RequiredDocuments({ onComplete, onBack }: RequiredDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(dummyDocuments)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'identity', 'financial', 'travel', 'supporting']
  
  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory)

  const requiredDocuments = documents.filter(doc => doc.required)
  const optionalDocuments = documents.filter(doc => !doc.required)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Required Documents</h1>
        <p className="text-gray-600">
          Please prepare the following documents for your visa application. 
          Required documents are mandatory, while supporting documents are optional but recommended.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category === 'all' ? 'All Documents' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Required Documents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          Required Documents ({requiredDocuments.length})
        </h2>
        <div className="grid gap-4">
          {filteredDocuments.filter(doc => doc.required).map((document) => (
            <Card key={document.id} className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 text-red-600 mr-2" />
                    {document.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(document.category)}>
                      {document.category}
                    </Badge>
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{document.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{document.description}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Optional Documents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          Supporting Documents ({optionalDocuments.length})
        </h2>
        <div className="grid gap-4">
          {filteredDocuments.filter(doc => !doc.required).map((document) => (
            <Card key={document.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    {document.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(document.category)}>
                      {document.category}
                    </Badge>
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{document.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{document.description}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>
                  <Button size="sm" variant="outline">
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Country Selection
        </Button>
        <Button 
          className="bg-red-600 hover:bg-red-700"
          onClick={onComplete}
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  )
}
