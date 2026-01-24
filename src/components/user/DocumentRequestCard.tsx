'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface DocumentRequestCardProps {
    request: any
    applicationId: string
    onResponse: () => void
}

export function DocumentRequestCard({ request, applicationId, onResponse }: DocumentRequestCardProps) {
    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            // 1. Upload File reusing existing API
            const formData = new FormData()
            formData.append('file', file)
            formData.append('applicationId', applicationId)
            formData.append('documentType', request.documentType)

            const uploadRes = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            })

            const uploadData = await uploadRes.json()
            if (!uploadData.success) throw new Error(uploadData.message)

            const documentId = uploadData.data.id

            // 2. Submit Response
            const respondRes = await fetch(`/api/user/applications/${applicationId}/document-requests/${request.id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId })
            })

            if (respondRes.ok) {
                toast.success('Document submitted successfully')
                onResponse()
            } else {
                throw new Error('Failed to submit response')
            }

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload')
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/20">
            <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{request.documentType}</h4>
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Action Required</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{request.reason}</p>
                        {request.instructions && (
                            <p className="text-xs text-gray-500 bg-white p-2 rounded border mb-3">
                                <span className="font-medium">Instructions:</span> {request.instructions}
                            </p>
                        )}
                        <p className="text-xs text-gray-400">Requested {new Date(request.requestedAt).toLocaleDateString()}</p>
                    </div>

                    <div>
                        <input
                            type="file"
                            id={`upload-${request.id}`}
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.png,.jpeg"
                            disabled={uploading}
                        />
                        <label htmlFor={`upload-${request.id}`}>
                            <Button asChild disabled={uploading} className="cursor-pointer">
                                <span>
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Upload
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
