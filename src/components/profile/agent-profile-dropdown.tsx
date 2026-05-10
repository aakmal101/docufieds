'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, LogOut, Briefcase, ShieldCheck, Clock, XCircle, CheckCircle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AgentProfileDropdownProps {
    user: {
        fullName?: string | null
        email?: string | null
        photoUrl?: string | null
        profileStatus?: string | null
    } | null
}

export default function AgentProfileDropdown({ user }: AgentProfileDropdownProps) {
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const getStatusBadge = (status: string | null | undefined) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <Badge className="bg-green-100 text-green-800 border-0 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" /> Approved
                    </Badge>
                )
            case 'PENDING_REVIEW':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs gap-1">
                        <Clock className="h-3 w-3" /> Pending
                    </Badge>
                )
            case 'DECLINED':
                return (
                    <Badge className="bg-red-100 text-red-800 border-0 text-xs gap-1">
                        <XCircle className="h-3 w-3" /> Declined
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs gap-1">
                        <Clock className="h-3 w-3" /> Not Applied
                    </Badge>
                )
        }
    }

    const getApprovalIcon = (status: string | null | undefined) => {
        switch (status) {
            case 'APPROVED':
                return <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
            case 'PENDING_REVIEW':
                return <Clock className="mr-2 h-4 w-4 text-yellow-600" />
            case 'DECLINED':
                return <XCircle className="mr-2 h-4 w-4 text-red-500" />
            default:
                return <ShieldCheck className="mr-2 h-4 w-4 text-gray-500" />
        }
    }

    if (!user) {
        return null
    }

    const initials = user.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AG'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-gray-200"
                    aria-label="Agent profile menu"
                >
                    {user.photoUrl ? (
                        <img
                            src={user.photoUrl}
                            alt={user.fullName || 'Agent'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-blue-50 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{initials}</span>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                {/* Profile Header */}
                <div className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="h-11 w-11 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                            {user.photoUrl ? (
                                <img
                                    src={user.photoUrl}
                                    alt={user.fullName || 'Agent'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Briefcase className="h-5 w-5 text-blue-600" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {user.fullName || 'Agent'}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Approval</span>
                        {getStatusBadge(user.profileStatus)}
                    </div>
                </div>

                <DropdownMenuSeparator />

                {/* Menu Items */}
                <div className="p-1">
                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agent/settings')}
                        className="cursor-pointer"
                    >
                        <Settings className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => router.push('/dashboard/agent/approval')}
                        className="cursor-pointer"
                    >
                        {getApprovalIcon(user.profileStatus)}
                        <span>Approval Status</span>
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
