
'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Upload, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PublicUploadPage() {
    const params = useParams()
    const token = params.token as string

    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Track upload status per slot
    const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)

    useEffect(() => {
        if (token) fetchSession()
    }, [token]) // eslint-disable-line

    const fetchSession = async () => {
        try {
            const response = await fetch(`/api/public/upload-sessions/${token}`)
            const data = await response.json()

            if (data.success) {
                setSession(data.data)
            } else {
                setError(data.message || 'Invalid link')
            }
        } catch (err) {
            setError('Failed to load upload session')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (slotIndex: number, file: File) => {
        if (!file) return

        // specific slot validation if needed

        setUploadingSlot(slotIndex)
        const formData = new FormData()
        formData.append('file', file)

        try {
            // API call to upload
            const response = await fetch(`/api/public/upload-sessions/${token}/slots/${slotIndex}/upload`, {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Document uploaded successfully')
                // Update local session state
                const updatedSlots = session.slots.map((s: any) => {
                    if (s.slotIndex === slotIndex) {
                        return { ...s, status: 'UPLOADED', uploadedDocument: data.data.document }
                    }
                    return s
                })

                const allUploaded = updatedSlots.every((s: any) => s.status === 'UPLOADED')

                setSession({
                    ...session,
                    slots: updatedSlots,
                    status: allUploaded ? 'COMPLETED' : session.status
                })

            } else {
                toast.error(data.message || 'Upload failed')
            }
        } catch (err) {
            toast.error('Error uploading file')
            console.error(err)
        } finally {
            setUploadingSlot(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-red-700">Link Expired or Invalid</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-gray-500">Please contact support to request a new upload link.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const completedCount = session.slots.filter((s: any) => s.status === 'UPLOADED').length
    const totalCount = session.slotCount
    const isAllCompleted = completedCount === totalCount

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Document Upload Request</h1>
                    <p className="mt-2 text-gray-600">
                        Hello {session.targetUser}, <span className="font-medium text-gray-900">{session.requester}</span> has requested the following documents.
                    </p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Required Documents</CardTitle>
                            <Badge variant={isAllCompleted ? "default" : "secondary"}>
                                {completedCount} / {totalCount} Completed
                            </Badge>
                        </div>
                        <CardDescription>
                            Please upload clear copies of the requested documents below.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {session.slots.map((slot: any) => (
                            <div key={slot.id} className="border rounded-lg p-4 bg-white shadow-sm transition-all hover:shadow-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`mt-1 rounded-full p-2 flex-shrink-0 ${slot.status === 'UPLOADED' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            {slot.status === 'UPLOADED' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <FileText className="h-5 w-5 text-gray-500" />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{slot.label}</h3>
                                            {slot.uploadedDocument ? (
                                                <p className="text-xs text-green-600 font-medium mt-1">
                                                    Uploaded: {slot.uploadedDocument.fileName}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-500 mt-1">Allowed formats: PDF, JPG, PNG (Max 10MB)</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full sm:w-auto">
                                        {slot.status === 'UPLOADED' ? (
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto text-green-700 bg-green-50 border-green-200 hover:bg-green-100 cursor-default">
                                                Uploaded
                                            </Button>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) handleFileUpload(slot.slotIndex, e.target.files[0])
                                                    }}
                                                    disabled={uploadingSlot !== null}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <Button size="sm" className="w-full sm:w-auto" disabled={uploadingSlot !== null}>
                                                    {uploadingSlot === slot.slotIndex ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" /> Upload File
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {isAllCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-800 mb-2">All Documents Uploaded!</h2>
                        <p className="text-green-700">
                            Thank you. Our team has been notified and will review your documents shortly.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
