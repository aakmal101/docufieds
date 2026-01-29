'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Inbox,
    BarChart3,
    LogOut,
    Globe,
    ClipboardList
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import toast from 'react-hot-toast'
import { SupportProfileMenu } from '@/components/support/SupportProfileMenu'

export default function SupportMemberLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()


    const navigation = [
        { name: 'My Applications', href: '/admin/support-member', icon: ClipboardList, exact: true },
        { name: 'My Performance', href: '/admin/support-member/performance', icon: BarChart3 },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Globe className="h-6 w-6 text-purple-600" />
                            <span className="font-bold text-xl text-gray-900">Docufieds Support</span>
                        </div>

                        <nav className="flex space-x-1">
                            {navigation.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                                    ${isActive
                                                ? 'bg-purple-50 text-purple-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                                    >
                                        <item.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-purple-500' : 'text-gray-400'}`} />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <SupportProfileMenu />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
