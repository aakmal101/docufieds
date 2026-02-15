'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Menu,
    LayoutDashboard,
    Inbox,
    Users,
    AlertTriangle,
    XCircle,
    BarChart3,
    LogOut,
    Globe,
    UserPlus,
    Settings,
    UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

export default function SupportLeadLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const navigation = [
        { name: 'Dashboard', href: '/admin/support-lead', icon: LayoutDashboard },
        { name: 'Incoming Apps', href: '/admin/support-lead/incoming', icon: Inbox },
        { name: 'Team Workload', href: '/admin/support-lead/team', icon: Users },
        { name: 'Profile Reviews', href: '/admin/users/reviews', icon: UserCheck },
        { name: 'Onboard Members', href: '/admin/support-lead/onboard', icon: UserPlus },
        { name: 'Escalations', href: '/admin/support-lead/escalations', icon: AlertTriangle },
        { name: 'Pending Rejections', href: '/admin/support-lead/rejections', icon: XCircle },
        { name: 'Reports', href: '/admin/support-lead/reports', icon: BarChart3 },
    ]

    const [sidebarOpen, setSidebarOpen] = useState(false)

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center">
                    <Globe className="h-6 w-6 text-red-600 mr-2" />
                    <span className="font-bold text-xl text-gray-900">Docufieds</span>
                </div>
                {/* Close button for mobile inside sidebar */}
                <div className="md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Support Lead
                    </p>
                </div>
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        const isExact = item.href === '/admin/support-lead' && pathname !== '/admin/support-lead'

                        const activeClass = isActive && !isExact
                            ? 'bg-red-50 text-red-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md group ${activeClass}`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 ${isActive && !isExact ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                            L
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">Support Lead</p>
                            <Link href="/admin/settings" className="text-xs text-gray-500 hover:text-gray-700 flex items-center">
                                <Settings className="h-3 w-3 mr-1" /> Settings
                            </Link>
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 border-r shadow-sm flex-col fixed h-full inset-y-0 z-50">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar (Fixed Overlay) */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />

                    {/* Drawer */}
                    <div className="relative w-64 bg-white shadow-xl h-full flex flex-col animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center">
                    <Globe className="h-6 w-6 text-red-600 mr-2" />
                    <span className="font-bold text-xl text-gray-900">Docufieds</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 p-4 md:p-8">
                {children}
            </div>
        </div>
    )
}

