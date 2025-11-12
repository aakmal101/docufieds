import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LandingPage from '@/components/landing-page'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    // Redirect based on user role
    switch (session.user.role) {
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

