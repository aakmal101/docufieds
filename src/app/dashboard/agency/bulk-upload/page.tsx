'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    Download,
    Clock,
    RefreshCw,
    XCircle,
    FileSpreadsheet
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { BulkUploadProgress } from '@/types/bulk-upload';

interface UploadHistoryItem {
    id: string;
    fileName: string;
    status: string;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    skippedRecords: number;
    uploadedAt: string;
    completedAt?: string;
    currentPhase?: string;
}

export default function BulkUploadPage() {
    const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<BulkUploadProgress | null>(null);
    const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    // Poll progress if active upload
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (activeUploadId) {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/bulk-upload/progress/${activeUploadId}`);
                    const data = await response.json();

                    if (data.success) {
                        setUploadProgress(data);

                        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
                            setActiveUploadId(null);
                            fetchHistory(); // Refresh history
                            if (data.status === 'COMPLETED') {
                                toast.success('Bulk upload completed');
                            } else {
                                toast.error('Bulk upload failed');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Progress poll error:', error);
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeUploadId]);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const response = await fetch('/api/bulk-upload/history');
            const data = await response.json();
            if (data.success) {
                setUploadHistory(data.uploads);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/bulk-upload/process', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setActiveUploadId(data.uploadId);
                toast.success('Upload started successfully');
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Something went wrong during upload');
        } finally {
            setIsUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        multiple: false,
        disabled: isUploading || !!activeUploadId,
    });

    const downloadTemplate = async () => {
        window.open('/api/bulk-upload/template', '_blank');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
            case 'PROCESSING':
            case 'VALIDATING':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 animate-pulse">Processing</Badge>;
            case 'FAILED':
                return <Badge variant="destructive">Failed</Badge>;
            case 'PENDING':
                return <Badge variant="secondary">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto max-w-6xl py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk Upload</h1>
                    <p className="text-gray-500 mt-1">Upload and process multiple visa applications at once.</p>
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload File</CardTitle>
                            <CardDescription>
                                Drag and drop your Excel or CSV file here. Max 100 records per file.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                    } ${isUploading || activeUploadId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="p-4 bg-gray-100 rounded-full">
                                        {isUploading ? (
                                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-medium">
                                            {isUploading ? 'Uploading...' : 'Drop file here or click to browse'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Supported formats: .xlsx, .xls, .csv
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Progress */}
                    {uploadProgress && (
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-lg">
                                    Processing Upload
                                    <Badge variant="outline" className="bg-white">
                                        {uploadProgress.status}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>{uploadProgress.currentPhase}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>
                                            {Math.round((uploadProgress.processedRecords / uploadProgress.totalRecords) * 100) || 0}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={(uploadProgress.processedRecords / uploadProgress.totalRecords) * 100}
                                        className="h-2"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <div className="text-sm text-gray-500 mb-1">Total</div>
                                        <div className="text-2xl font-bold">{uploadProgress.totalRecords}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <div className="text-sm text-green-600 mb-1">Success</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {uploadProgress.successfulRecords}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <div className="text-sm text-red-600 mb-1">Failed</div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {uploadProgress.failedRecords}
                                        </div>
                                    </div>
                                </div>

                                {uploadProgress.errors.length > 0 && (
                                    <div className="space-y-3 mt-6">
                                        <h4 className="font-medium text-red-700 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Error Summary
                                        </h4>
                                        <div className="max-h-48 overflow-y-auto bg-white rounded-md border p-4 space-y-2">
                                            {uploadProgress.errors.map((error, idx) => (
                                                <div key={idx} className="text-sm text-red-600 border-b last:border-0 pb-2">
                                                    <span className="font-medium">Row {error.row}: </span>
                                                    {error.message}
                                                    {error.field !== 'multiple' && (
                                                        <span className="text-gray-500 ml-1">({error.field})</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* History Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Recent Uploads
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingHistory ? (
                                <div className="flex justify-center p-8">
                                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : uploadHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No uploads yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {uploadHistory.map((upload) => (
                                        <div
                                            key={upload.id}
                                            className="p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium truncate max-w-[150px]" title={upload.fileName}>
                                                    {upload.fileName}
                                                </div>
                                                {getStatusBadge(upload.status)}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">
                                                {new Date(upload.uploadedAt).toLocaleDateString()} • {new Date(upload.uploadedAt).toLocaleTimeString()}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {upload.successfulRecords}
                                                </div>
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <XCircle className="w-3 h-3" />
                                                    {upload.failedRecords}
                                                </div>
                                                <div className="text-gray-400 ml-auto text-xs">
                                                    {upload.totalRecords} records
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
    );
}
