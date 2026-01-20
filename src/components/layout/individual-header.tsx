'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NotificationDropdown from '@/components/notifications/notification-dropdown'
import ProfileDropdown from '@/components/profile/profile-dropdown'

export default function IndividualHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  // Determine if we should show back button (not on main dashboard)
  const showBackButton = pathname !== '/dashboard/individual'
  const isMainDashboard = pathname === '/dashboard/individual'

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (data.success) {
        setUser(data.data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/individual')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Docufieds Logo" 
                className="h-16 w-36 object-contain"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {session?.user?.id && (
              <>
                <NotificationDropdown userId={session.user.id} />
                <ProfileDropdown user={user} />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
