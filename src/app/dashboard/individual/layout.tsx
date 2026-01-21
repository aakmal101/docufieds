'use client'

import IndividualHeader from '@/components/layout/individual-header'

import { ComponentErrorBoundary } from '@/components/ui/component-error-boundary'

export default function IndividualLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ComponentErrorBoundary name="Header">
        <IndividualHeader />
      </ComponentErrorBoundary>
      {children}
    </div>
  )
}
