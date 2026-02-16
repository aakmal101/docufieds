
'use client'

import AgentHeader from '@/components/layout/agent-header'
import { ComponentErrorBoundary } from '@/components/ui/component-error-boundary'

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <ComponentErrorBoundary name="AgentHeader">
                <AgentHeader />
            </ComponentErrorBoundary>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
