'use client'

import AgencyHeader from '@/components/layout/agency-header'
import { ComponentErrorBoundary } from '@/components/ui/component-error-boundary'

export default function AgencyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <ComponentErrorBoundary name="AgencyHeader">
                <AgencyHeader />
            </ComponentErrorBoundary>
            {children}
        </div>
    )
}
