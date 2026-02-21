'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
  MessageCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useNotificationsRealtime } from '@/lib/supabase/realtime'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  actionUrl?: string | null
}

interface NotificationSystemProps {
  userId: string
}

export default function NotificationSystem({ userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  // Use Supabase Realtime for live notifications
  useNotificationsRealtime(userId, (newNotification) => {
    setNotifications(prev => {
      // Check if notification already exists (avoid duplicates)
      const exists = prev.some(n => n.id === newNotification.id)
      if (exists) return prev

      // Add new notification at the beginning
      return [newNotification, ...prev]
    })
    setUnreadCount(prev => prev + 1)
  })

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data)
        setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        const deletedNotification = notifications.find(n => n.id === notificationId)
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_created':
      case 'payment_success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'application_update':
      case 'status_update':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'document_requirements':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'MESSAGE':
        return <MessageCircle className="h-5 w-5 text-primary" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_created':
      case 'payment_success':
        return 'border-green-200 bg-green-50'
      case 'application_update':
      case 'status_update':
        return 'border-blue-200 bg-blue-50'
      case 'document_requirements':
        return 'border-yellow-200 bg-yellow-50'
      case 'MESSAGE':
        return 'border-primary/20 bg-primary/5'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2" variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated with your application progress
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors ${notification.isRead
                  ? 'border-gray-200 bg-white'
                  : getNotificationColor(notification.type)
                  }`}
              >
                <div className="flex items-start justify-between">
                  {notification.actionUrl ? (
                    <Link href={notification.actionUrl} className="flex items-start space-x-3 flex-1 hover:underline decoration-primary cursor-pointer px-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start space-x-3 flex-1 px-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}



















