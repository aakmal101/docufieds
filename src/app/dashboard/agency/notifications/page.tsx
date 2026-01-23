'use client'

import { useNotifications, useMarkAllAsRead, useMarkAsRead } from '@/lib/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCheck, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function NotificationsPage() {
    const { data, isLoading } = useNotifications()
    const markAllAsRead = useMarkAllAsRead()
    const markAsRead = useMarkAsRead()

    const notifications = data?.data || []

    if (isLoading) {
        return <div className="p-8">Loading notifications...</div>
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-1">Stay updated with your latest activities.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-4 max-w-4xl">
                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p>You're all caught up! No notifications.</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notification: any) => (
                        <Card
                            key={notification.id}
                            className={`transition-all ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/10' : ''}`}
                        >
                            <div className="flex justify-between items-start p-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{notification.title}</h3>
                                        {!notification.isRead && <Badge variant="secondary" className="text-xs">New</Badge>}
                                    </div>
                                    <p className="text-sm text-gray-500">{notification.message}</p>
                                    <p className="text-xs text-gray-400 pt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead.mutate(notification.id)}
                                        className="text-xs"
                                    >
                                        Mark read
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
