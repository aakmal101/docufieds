'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useSupportNotifications } from '@/lib/supabase/realtime-support'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    title: string
    message: string
    createdAt: string
    isRead: boolean
    actionUrl?: string
    type: string // 'assignment', 'document_update', 'system'
}

export function SupportNotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/admin/support-member/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
            }
        } catch (error) {
            console.error('Failed to fetch notifications')
        }
    }

    const [memberId, setMemberId] = useState<string | undefined>()

    useEffect(() => {
        fetch('/api/auth/support-member/me').then(res => res.json()).then(data => {
            if (data.id) setMemberId(data.id)
        })
    }, [])

    useEffect(() => {
        // Initial fetch
        fetchNotifications()
    }, [])

    useSupportNotifications(memberId, () => {
        fetchNotifications()
        toast.success('New notification')
    })

    const markAsRead = async (id: string, actionUrl?: string) => {
        try {
            await fetch('/api/admin/support-member/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            })

            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))

            if (actionUrl) {
                setIsOpen(false)
                router.push(actionUrl)
            }
        } catch (error) {
            console.error('Failed to mark read')
        }
    }

    const markAllRead = async () => {
        try {
            await fetch('/api/admin/support-member/notifications', {
                method: 'PUT' // Distinct method for "mark all"
            })
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
            toast.success('All notifications marked as read')
        } catch (error) {
            toast.error('Failed to update')
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-purple-50/50' : ''
                                        }`}
                                    onClick={() => markAsRead(notification.id, notification.actionUrl)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-purple-600 flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
