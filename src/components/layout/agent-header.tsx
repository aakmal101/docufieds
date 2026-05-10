
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Globe, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AgentProfileDropdown from '@/components/profile/agent-profile-dropdown'

export default function AgentHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<{
        fullName?: string | null
        email?: string | null
        photoUrl?: string | null
        profileStatus?: string | null
    } | null>(null)

    const showBackButton = pathname !== '/dashboard/agent'

    useEffect(() => {
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setUser({
                        fullName: data.data.fullName || data.data.individualProfile?.firstName,
                        email: data.data.email,
                        photoUrl: data.data.photoUrl,
                        profileStatus: data.data.profileStatus || null,
                    })
                }
            })
            .catch(() => { })
    }, [])

    const handleBack = () => {
        router.push('/dashboard/agent')
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
                        <div className="flex items-center cursor-pointer" onClick={() => router.push('/dashboard/agent')}>
                            <Globe className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">Docufieds <span className="text-xs text-gray-500 font-normal ml-1 border rounded px-1">Agent</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user && (
                            <AgentProfileDropdown user={user} />
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
