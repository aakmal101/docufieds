import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/services/auth-service'
import LandingPage from '@/components/landing-page'

// Force dynamic rendering - this page uses auth cookies
export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getCurrentUser()
  
  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'INDIVIDUAL':
        redirect('/dashboard/individual')
      case 'AGENCY':
        redirect('/dashboard/agency')
      case 'ADMIN':
        redirect('/admin')
      case 'SUPPORT':
        redirect('/admin/support')
      case 'LEGAL':
        redirect('/admin/legal')
      case 'ACCOUNTS':
        redirect('/admin/accounts')
      case 'CASH_OFFICER':
        redirect('/admin/cash')
      default:
        redirect('/dashboard')
    }
  }

  return <LandingPage />
}
