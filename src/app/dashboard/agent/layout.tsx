'use client'

import AgentHeader from '@/components/layout/agent-header'
import { ComponentErrorBoundary } from '@/components/ui/component-error-boundary'

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <ComponentErrorBoundary name="Header">
                <AgentHeader />
            </ComponentErrorBoundary>
            {children}
        </div>
    )
}
