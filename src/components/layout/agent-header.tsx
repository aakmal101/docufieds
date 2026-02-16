
'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Globe, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AgentProfileDropdown from '@/components/profile/agent-profile-dropdown'

export default function AgentHeader() {
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [profileStatus, setProfileStatus] = useState<string | null>(null)

    const showBackButton = pathname !== '/dashboard/agent'

    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        setProfileStatus(data.data.profileStatus || null)
                    }
                })
                .catch(() => { })
        }
    }, [session?.user?.id])

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
                        {session?.user && (
                            <AgentProfileDropdown user={{
                                fullName: session.user.name,
                                email: session.user.email,
                                photoUrl: session.user.image,
                                profileStatus: profileStatus,
                            }} />
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
