'use client'

import { createClient } from './client'
import { useEffect } from 'react'

/**
 * Subscribe to notifications in real-time
 */
export function useNotificationsRealtime(
  userId: string,
  callback: (notification: any) => void
) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, callback])
}

/**
 * Subscribe to application status updates in real-time
 */
export function useApplicationStatusRealtime(
  applicationId: string,
  callback: (statusUpdate: any) => void
) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`application:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_updates',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applicationId, callback])
}

