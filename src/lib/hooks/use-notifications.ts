import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from 'next-auth/react'

interface NotificationFilters {
    page?: number
    limit?: number
    unreadOnly?: boolean
}

export function useNotifications(filters?: NotificationFilters) {
    return useQuery({
        queryKey: ['notifications', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.page) params.set('page', filters.page.toString())
            if (filters?.limit) params.set('limit', filters.limit.toString())
            if (filters?.unreadOnly) params.set('unreadOnly', 'true')

            const response = await fetch(`/api/agency/notifications?${params}`)
            if (!response.ok) throw new Error('Failed to fetch notifications')
            return response.json()
        },
    })
}

export function useUnreadCount() {
    const { data: session } = useSession()
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['unread-notifications-count'],
        queryFn: async () => {
            const response = await fetch('/api/agency/notifications/unread-count')
            if (!response.ok) throw new Error('Failed to fetch count')
            return response.json()
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    })

    // Real-time updates via Supabase
    useEffect(() => {
        if (!session?.user?.id) return

        const supabase = createClient()

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${session.user.id}`,
                },
                () => {
                    // Refetch count when notification changes
                    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
                    queryClient.invalidateQueries({ queryKey: ['notifications'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [session?.user?.id, queryClient])

    return query
}

export function useMarkAsRead() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await fetch(`/api/agency/notifications/${notificationId}/read`, {
                method: 'POST',
            })
            if (!response.ok) throw new Error('Failed to mark as read')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
        },
    })
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/agency/notifications/mark-all-read', {
                method: 'POST',
            })
            if (!response.ok) throw new Error('Failed to mark all as read')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
        },
    })
}
