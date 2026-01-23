'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    Download,
    Clock,
    RefreshCw,
    XCircle,
    FileArchive // For ZIP icon
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

    // New state for ZIP upload
    const [isZipMode, setIsZipMode] = useState(false); // Toggle logic if needed, or simple flow
    const [selectedUploadForZip, setSelectedUploadForZip] = useState<string | null>(null);
    const [zipUploadResult, setZipUploadResult] = useState<any>(null);

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
                            // If completed successfully, we can prompt for ZIP
                            const isSuccess = data.status === 'COMPLETED';

                            if (isSuccess && !selectedUploadForZip) {
                                setSelectedUploadForZip(activeUploadId);
                                toast.success('Excel processed! Now upload documents if needed.');
                            } else if (!isSuccess) {
                                toast.error('Bulk upload failed');
                            }

                            setActiveUploadId(null);
                            fetchHistory(); // Refresh history
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
    }, [activeUploadId, selectedUploadForZip]);

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

    // EXCEL DROPZONE
    const onDropExcel = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setZipUploadResult(null); // Reset previous results
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

    const { getRootProps: getExcelRoot, getInputProps: getExcelInput, isDragActive: isExcelDrag } = useDropzone({
        onDrop: onDropExcel,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        multiple: false,
        disabled: isUploading || !!activeUploadId,
    });

    // ZIP DROPZONE
    const onDropZip = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file || !selectedUploadForZip) {
            toast.error("Please select a completed upload first");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bulkUploadId', selectedUploadForZip);

        try {
            const response = await fetch('/api/bulk-upload/upload-zip', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setZipUploadResult(data.data);
                toast.success(`Processed details: ${data.data.matchedDocuments} matched.`);
                fetchHistory(); // Refresh statuses
            } else {
                toast.error(data.error || 'ZIP Processing Failed');
            }
        } catch (error) {
            toast.error("Network error uploading ZIP");
        } finally {
            setIsUploading(false);
        }
    }, [selectedUploadForZip]);

    const { getRootProps: getZipRoot, getInputProps: getZipInput, isDragActive: isZipDrag } = useDropzone({
        onDrop: onDropZip,
        accept: {
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip']
        },
        maxFiles: 1,
        disabled: isUploading || !selectedUploadForZip
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

    // Helper to select upload from history for ZIP attachment
    const handleHistorySelect = (id: string, status: string) => {
        if (status === 'COMPLETED') {
            setSelectedUploadForZip(id);
            setZipUploadResult(null);
            toast.success("Ready to upload ZIP documents for this batch.");
        } else {
            toast.error("Only completed uploads can accept documents.");
        }
    }

    return (
        <div className="container mx-auto max-w-6xl py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk Upload</h1>
                    <p className="text-gray-500 mt-1">Upload Excel data first, then upload ZIP documents.</p>
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-8">

                    {/* STEP 1: EXCEL UPLOAD */}
                    <Card className={selectedUploadForZip ? "opacity-60" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Step 1</span>
                                Upload Data (Excel/CSV)
                            </CardTitle>
                            <CardDescription>
                                Max 100 records per file. Creates applications instantly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                {...getExcelRoot()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isExcelDrag ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                    } ${isUploading || activeUploadId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input {...getExcelInput()} />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    {isUploading && !selectedUploadForZip ? (
                                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-gray-500" />
                                    )}
                                    <p className="font-medium text-sm">
                                        Drag Excel file here
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* STEP 2: ZIP UPLOAD */}
                    <Card className={!selectedUploadForZip ? "border-dashed" : "border-blue-200 shadow-md"}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${selectedUploadForZip ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>Step 2</span>
                                Upload Documents (ZIP)
                            </CardTitle>
                            <CardDescription>
                                {selectedUploadForZip
                                    ? "Upload ZIP containing files matched by filename."
                                    : "Complete Step 1 or select a completed upload from history to unlock."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                {...getZipRoot()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isZipDrag ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-50'
                                    } ${!selectedUploadForZip || isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <input {...getZipInput()} />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    {isUploading && selectedUploadForZip ? (
                                        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                                    ) : (
                                        <FileArchive className={`w-8 h-8 ${selectedUploadForZip ? 'text-green-600' : 'text-gray-300'}`} />
                                    )}
                                    <p className="font-medium text-sm">
                                        {selectedUploadForZip ? "Drag ZIP file here" : "Locked"}
                                    </p>
                                </div>
                            </div>

                            {/* ZIP RESULTS */}
                            {zipUploadResult && (
                                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                                    <h4 className="font-bold text-green-800 text-sm mb-2">ZIP Processing Results</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>Files Found: <b>{zipUploadResult.totalFilesFound}</b></div>
                                        <div>Matches: <b className="text-green-600">{zipUploadResult.matchedDocuments}</b></div>
                                        <div>Exist Skipped: <b>{zipUploadResult.existingSkipped}</b></div>
                                        <div>Failures: <b className="text-red-600">{zipUploadResult.uploadFailures}</b></div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Progress (Exclusively for Excel currently, or could scale) */}
                    {uploadProgress && (
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm">Processing Data...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Progress value={(uploadProgress.processedRecords / uploadProgress.totalRecords) * 100} className="h-2 mb-2" />
                                <div className="text-xs text-center text-gray-500">
                                    {uploadProgress.processedRecords} / {uploadProgress.totalRecords} records
                                </div>
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
                                History
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
                                            onClick={() => handleHistorySelect(upload.id, upload.status)}
                                            className={`p-4 rounded-lg border transition-colors cursor-pointer ${selectedUploadForZip === upload.id
                                                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                                                    : 'bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium truncate max-w-[150px] text-sm" title={upload.fileName}>
                                                    {upload.fileName}
                                                </div>
                                                {getStatusBadge(upload.status)}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">
                                                {new Date(upload.uploadedAt).toLocaleDateString()}
                                            </div>
                                            {selectedUploadForZip === upload.id && (
                                                <div className="text-xs text-blue-600 font-medium mt-1">
                                                    Active for ZIP Upload
                                                </div>
                                            )}
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
