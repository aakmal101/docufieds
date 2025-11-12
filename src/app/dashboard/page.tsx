'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Redirect based on user role
    switch (session.user?.role) {
      case 'INDIVIDUAL':
        router.push('/dashboard/individual')
        break
      case 'AGENCY':
        router.push('/dashboard/agency')
        break
      case 'ADMIN':
        router.push('/admin')
        break
      case 'SUPPORT':
        router.push('/admin/support')
        break
      case 'LEGAL':
        router.push('/admin/legal')
        break
      case 'ACCOUNTS':
        router.push('/admin/accounts')
        break
      case 'CASH_OFFICER':
        router.push('/admin/cash')
        break
      default:
        router.push('/dashboard/individual')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}














