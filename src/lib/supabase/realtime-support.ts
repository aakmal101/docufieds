import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export const useApplicationAssignments = (memberId: string | undefined, callback: (payload: any) => void) => {
    const router = useRouter()
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!memberId) return

        const supabase = createClient()

        const channel = supabase
            .channel('realtime-assignments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'application_assignments',
                    filter: `member_id=eq.${memberId}`
                },
                (payload) => {
                    console.log('Assignment change received!', payload)
                    callbackRef.current(payload)
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [memberId, router])
}

export const useEscalations = (leadId: string | undefined, callback: (payload: any) => void) => {
    const router = useRouter()
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!leadId) return

        const supabase = createClient()

        const channel = supabase
            .channel('realtime-escalations')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'escalations'
                },
                (payload) => {
                    console.log('Escalation received!', payload)
                    callbackRef.current(payload)
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [leadId, router])
}

export const useRejectionRequests = (leadId: string | undefined, callback: (payload: any) => void) => {
    const router = useRouter()
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!leadId) return

        const supabase = createClient()

        const channel = supabase
            .channel('realtime-rejections')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'rejection_requests'
                },
                (payload) => {
                    console.log('Rejection Request received!', payload)
                    callbackRef.current(payload)
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [leadId, router])
}

export const useSupportMessages = (applicationId: string | undefined, callback: (payload: any) => void) => {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!applicationId) return

        const supabase = createClient()

        const channel = supabase
            .channel(`messages:${applicationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `application_id=eq.${applicationId}`
                },
                (payload) => {
                    console.log('New message received!', payload)
                    callbackRef.current(payload)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [applicationId])
}

export const useDocumentRequests = (applicationId: string | undefined, callback: (payload: any) => void) => {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!applicationId) return

        const supabase = createClient()

        const channel = supabase
            .channel(`doc-requests:${applicationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for Updates too (status changes)
                    schema: 'public',
                    table: 'document_requests',
                    filter: `application_id=eq.${applicationId}`
                },
                (payload) => {
                    console.log('Doc request update!', payload)
                    callbackRef.current(payload)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [applicationId])
}

export const useSupportNotifications = (memberId: string | undefined, callback: (payload: any) => void) => {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    useEffect(() => {
        if (!memberId) return

        const supabase = createClient()

        const channel = supabase
            .channel(`notifications:${memberId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications', // Ensure this matches prisma mapping
                    filter: `member_id=eq.${memberId}`
                },
                (payload) => {
                    console.log('New notification received!', payload)
                    callbackRef.current(payload)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [memberId])
}

