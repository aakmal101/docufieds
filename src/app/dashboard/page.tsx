import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/services/auth-service'

// Force dynamic rendering - this page uses auth cookies
export const dynamic = 'force-dynamic'

/**
 * Dashboard Router (Server Component)
 *
 * Middleware guarantees that only authenticated users reach /dashboard.
 * This page reads the user's role from Prisma and redirects them to
 * the correct role-specific dashboard.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    // Shouldn't happen — middleware redirects unauthed users to /auth/signin.
    // Belt-and-suspenders guard.
    redirect('/auth/signin')
  }

  // Redirect based on user role
  switch (user.role) {
    case 'INDIVIDUAL':
      redirect('/dashboard/individual')
    case 'AGENCY':
      redirect('/dashboard/agency')
    case 'AGENT':
      redirect('/dashboard/agent')
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
      redirect('/dashboard/individual')
  }
}
