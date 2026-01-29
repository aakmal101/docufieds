'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { User, LogOut, Mail, Globe } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export function SupportProfileMenu() {
    const router = useRouter()
    const { data: session } = useSession()
    const user = session?.user

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/support-member/logout', { method: 'POST' })
            router.push('/auth/support-member/login')
            router.refresh()
        } catch (error) {
            toast.error('Logout failed')
        }
    }

    // Fallback if session not ready (skeleton-like or empty)
    if (!user) {
        return (
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-white ml-2">
                <Avatar className="h-10 w-10 bg-gray-100 animate-pulse">
                    <AvatarFallback></AvatarFallback>
                </Avatar>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-2 ring-white ml-2">
                    <Avatar className="h-10 w-10 bg-purple-100">
                        {user.image ? (
                            <AvatarImage src={user.image} alt={user.name || 'Member'} />
                        ) : (
                            <AvatarFallback className="text-purple-700 font-bold">
                                {user.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
                            </AvatarFallback>
                        )}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 z-[60]">
                {/* Profile Header */}
                <div className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-12 w-12 bg-purple-100 border-2 border-white shadow-sm">
                            {user.image ? (
                                <AvatarImage src={user.image} className="object-cover" />
                            ) : (
                                <AvatarFallback className="text-purple-700 text-lg">
                                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
                                </AvatarFallback>
                            )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {user.name || 'Support Member'}
                            </p>
                            {user.email && (
                                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                </p>
                            )}
                            <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0 h-4">
                                Support Team
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="p-1">
                    <DropdownMenuItem
                        onClick={() => router.push('/admin/support-member/performance')}
                        className="cursor-pointer"
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                <div className="p-1">
                    <DropdownMenuItem
                        onClick={handleLogout}
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
