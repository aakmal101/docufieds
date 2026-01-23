'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { User, Settings, LogOut, Mail, Building2, HelpCircle, BarChart3, CreditCard, Bell } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AgencyProfileDropdownProps {
    user: {
        fullName?: string | null
        email?: string | null
        agencyName?: string | null
        agencyLicense?: string | null
        status?: string | null
        photoUrl?: string | null
    } | null
}

export default function AgencyProfileDropdown({ user }: AgencyProfileDropdownProps) {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
    }

    const getStatusColor = (status: string | null | undefined) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800'
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800'
            case 'UNDER_REVIEW':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (!user) {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-gray-200"
                    aria-label="Agency profile menu"
                >
                    {user.photoUrl ? (
                        <img
                            src={user.photoUrl}
                            alt={user.agencyName || 'Agency'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-gray-500" />
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                {/* Profile Header */}
                <div className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="h-12 w-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            {user.photoUrl ? (
                                <img
                                    src={user.photoUrl}
                                    alt={user.agencyName || 'Agency'}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <Building2 className="h-6 w-6 text-red-600" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {user.agencyName || 'Agency'}
                            </p>
                            <p className="text-xs text-gray-500 truncate flex items-center mt-0.5">
                                License: <span className="font-mono ml-1">{user.agencyLicense || 'N/A'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{user.fullName || 'Admin'}</span>
                        </div>
                        {user.status && (
                            <Badge variant="outline" className={`${getStatusColor(user.status)} border-0`}>
                                {user.status.replace(/_/g, ' ')}
                            </Badge>
                        )}
                    </div>
                </div>

                <DropdownMenuSeparator />

                {/* Menu Items */}
                <div className="p-1">
                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agency/profile')}
                        className="cursor-pointer"
                    >
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Profile Information</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agency/settings')}
                        className="cursor-pointer"
                    >
                        <Settings className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agency/analytics')}
                        className="cursor-pointer"
                    >
                        <BarChart3 className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Analytics</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agency/billing')}
                        className="cursor-pointer"
                    >
                        <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Billing & Invoices</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agency/notifications')}
                        className="cursor-pointer"
                    >
                        <Bell className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Notifications</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agency/help')}
                        className="cursor-pointer"
                    >
                        <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Help & Support</span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                <div className="p-1">
                    <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
