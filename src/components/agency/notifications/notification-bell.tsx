'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUnreadCount, useNotifications, useMarkAsRead } from '@/lib/hooks/use-notifications'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

interface NotificationBellProps {
    userId?: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const { data: countData } = useUnreadCount(userId)
    const { data: notificationsData } = useNotifications({ limit: 5, unreadOnly: true })
    const markAsRead = useMarkAsRead()

    const unreadCount = countData?.data?.count || 0
    const notifications = notificationsData?.data || []

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full px-1"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <Link href="/dashboard/agency/notifications" className="text-sm text-blue-600 hover:underline">
                        View all
                    </Link>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No new notifications
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification: any) => (
                                <div
                                    key={notification.id}
                                    className="p-4 border-b hover:bg-accent cursor-pointer transition-colors"
                                    onClick={() => markAsRead.mutate(notification.id)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-medium text-sm">{notification.title}</p>
                                        {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
