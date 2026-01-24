'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface Document {
    id: string
    documentType: string
    fileName: string
    fileUrl: string
    uploadedAt: string
    status?: string // We might need to add a status field to Document model if we want per-doc approval state. 
    // For now, we can perhaps assume if no open request, it's fine, or we need a local state.
    // The design implies "Approve/Reject/Request New".
    // If we reject, we essentially create a DocumentRequest.
}

interface DocumentReviewProps {
    documents: Document[]
    applicationId: string
    onUpdate: () => void
}

export function DocumentReview({ documents, applicationId, onUpdate }: DocumentReviewProps) {
    // Mocking per-document status state for this session until we persist it
    // In a real app, 'Document' model would likely have 'verificationStatus'

    const handleOpen = (url: string) => {
        window.open(url, '_blank')
    }

    const handleRequestChange = (doc: Document) => {
        // Open a modal to create a DocumentRequest
        // For MVP, just a toast
        toast('Requesting changes is implemented in the Actions panel', { icon: 'ℹ️' })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {documents.length === 0 ? (
                    <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-white p-2 rounded border">
                                    <FileText className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{doc.documentType}</p>
                                    <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleOpen(doc.fileUrl)}>
                                    <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRequestChange(doc)}>
                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
