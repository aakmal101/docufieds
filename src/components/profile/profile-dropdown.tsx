'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, LogOut, Mail } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VerifiedBadge } from '@/components/user/VerifiedBadge'

interface ProfileDropdownProps {
  user: {
    fullName?: string | null
    email?: string | null
    phone?: string | null
    photoUrl?: string | null
    memberId?: string | null
    status?: string | null
    profileStatus?: string | null
  } | null
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
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
          className="relative h-10 w-10 rounded-full p-0"
          aria-label="Profile menu"
        >
          {user.photoUrl ? (
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 relative">
              <img
                src={user.photoUrl}
                alt={user.fullName || 'Profile'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center fallback-avatar hidden absolute inset-0">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Profile Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-2">
            {user.photoUrl ? (
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 relative flex-shrink-0">
                <img
                  src={user.photoUrl}
                  alt={user.fullName || 'Profile'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.parentElement?.querySelector('.fallback-avatar-header') as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center fallback-avatar-header hidden absolute inset-0">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 flex-shrink-0">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
                {user.fullName || 'User'}
                <VerifiedBadge status={user.profileStatus || 'PENDING'} className="h-4 w-4" />
              </p>
              {user.email && (
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
              )}
              {user.memberId && (
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  ID: {user.memberId}
                </p>
              )}
            </div>
          </div>
          {user.status && (
            <Badge className={getStatusColor(user.status)}>
              {user.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem
          onClick={() => router.push('/dashboard/individual/profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile Information</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push('/dashboard/individual/settings')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
