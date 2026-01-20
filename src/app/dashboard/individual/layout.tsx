'use client'

import IndividualHeader from '@/components/layout/individual-header'

export default function IndividualLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <IndividualHeader />
      {children}
    </div>
  )
}
