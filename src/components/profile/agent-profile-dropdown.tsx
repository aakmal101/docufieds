
'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { User, LogOut, Briefcase } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface AgentProfileDropdownProps {
    user: {
        fullName?: string | null
        email?: string | null
        photoUrl?: string | null
    } | null
}

export default function AgentProfileDropdown({ user }: AgentProfileDropdownProps) {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' })
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
                    aria-label="Agent profile menu"
                >
                    <div className="h-full w-full bg-blue-50 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="p-4 border-b bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900 truncate">
                        {user.fullName || 'Agent'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                        {user.email}
                    </p>
                </div>

                <div className="p-1">
                    <DropdownMenuItem
                        disabled
                        className="cursor-not-allowed"
                    >
                        <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Assignments</span>
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
