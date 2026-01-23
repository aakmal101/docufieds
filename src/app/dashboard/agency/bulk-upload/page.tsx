'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function BulkUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStatus('idle')
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        // Simulate upload delay
        setTimeout(() => {
            setUploading(false)
            setStatus('success')
        }, 2000)
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Bulk Application Upload</h1>
                <p className="text-gray-600 mt-2">
                    Upload multiple visa applications at once using a CSV or Excel file.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>
                        Supported formats: .csv, .xlsx. Max file size: 5MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-gray-50 transition-colors">
                            <Upload className="h-12 w-12 text-gray-400 mb-4" />
                            <Label htmlFor="file-upload" className="mb-2 text-lg font-medium text-gray-900 cursor-pointer">
                                {file ? file.name : 'Click to select file'}
                            </Label>
                            <Input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".csv, .xlsx"
                                onChange={handleFileChange}
                            />
                            <p className="text-sm text-gray-500">
                                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Drag and drop or browse'}
                            </p>
                        </div>

                        {status === 'success' && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Upload Successful</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Your file has been uploaded and is being processed. You will be notified when it's complete.
                                </AlertDescription>
                            </Alert>
                        )}

                        {status === 'error' && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Upload Failed</AlertTitle>
                                <AlertDescription>
                                    There was an error uploading your file. Please try again.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading ? 'Uploading...' : 'Upload Applications'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Download the template file before uploading.</li>
                    <li>Ensure all required fields (Client Name, Passport, Country, Process Type) are filled.</li>
                    <li>Do not modify the header row.</li>
                </ul>
            </div>
        </div>
    )
}
