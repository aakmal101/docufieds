'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
                <p className="text-gray-600 mb-6">
                    We encountered an error while loading this page.
                    {error.message && <span className="block mt-2 font-mono text-xs bg-gray-100 p-2 rounded text-red-500">{error.message}</span>}
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => reset()} variant="default">
                        Try again
                    </Button>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Reload Page
                    </Button>
                </div>
            </div>
        </div>
    )
}
