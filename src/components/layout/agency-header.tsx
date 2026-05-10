'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NotificationDropdown from '@/components/notifications/notification-dropdown'
import AgencyProfileDropdown from '@/components/profile/agency-profile-dropdown'

import { VerifiedBadge } from '@/components/user/VerifiedBadge'
import { AppUser } from '@/types/user'

export default function AgencyHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<AppUser | null>(null)

    // Determine if we should show back button (not on main dashboard)
    const showBackButton = pathname !== '/dashboard/agency'

    useEffect(() => {
        fetchUserProfile()
        // Poll for status updates
        const interval = setInterval(fetchUserProfile, 10000)
        return () => clearInterval(interval)
    }, [])

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
        router.push('/dashboard/agency')
    }

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        )}
                        <div className="flex items-center cursor-pointer" onClick={() => router.push('/dashboard/agency')}>
                            <Globe className="h-8 w-8 text-red-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">Docufieds</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.id && (
                            <>
                                <div className="mr-2 hidden md:block flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 text-right flex items-center gap-1">
                                        {user?.agencyProfile?.businessName ?? 'Agency'}
                                        <VerifiedBadge status={user?.profileStatus ?? undefined} className="h-4 w-4" />
                                    </p>
                                </div>
                                <NotificationDropdown userId={user.id} />
                                <AgencyProfileDropdown user={user} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
