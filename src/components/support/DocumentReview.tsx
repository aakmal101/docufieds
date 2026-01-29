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
    const [processingId, setProcessingId] = useState<string | null>(null)

    const handleOpen = (url: string) => {
        window.open(url, '_blank')
    }

    const handleReview = async (doc: Document, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${status} this document?`)) return

        setProcessingId(doc.id)
        try {
            const res = await fetch('/api/admin/support-member/documents/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: doc.id, status })
            })

            if (res.ok) {
                toast.success(`Document ${status}`)
                onUpdate()
            } else {
                toast.error('Failed to update status')
            }
        } catch (error) {
            toast.error('Error processing request')
        } finally {
            setProcessingId(null)
        }
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
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm truncate">{doc.documentType}</p>
                                        <Badge
                                            variant={doc.status === 'APPROVED' ? 'default' : doc.status === 'REJECTED' ? 'destructive' : 'secondary'}
                                            className={doc.status === 'APPROVED' ? 'bg-green-500' : ''}
                                        >
                                            {doc.status || 'PENDING'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleOpen(doc.fileUrl)}>
                                    <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                                {doc.status !== 'APPROVED' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleReview(doc, 'APPROVED')}
                                        disabled={!!processingId}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                )}
                                {doc.status !== 'REJECTED' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleReview(doc, 'REJECTED')}
                                        disabled={!!processingId}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
