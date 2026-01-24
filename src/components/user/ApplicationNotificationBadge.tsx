'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useDocumentRequests } from '@/lib/supabase/realtime-support'

export function ApplicationNotificationBadge({ applicationId }: { applicationId: string }) {
    const [count, setCount] = useState(0)

    const check = async () => {
        try {
            // Check pending docs
            const resDocs = await fetch(`/api/user/applications/${applicationId}/document-requests`)
            const docs = await resDocs.json()

            // We could also check unread messages if there was a lightweight endpoint

            if (Array.isArray(docs)) {
                setCount(docs.length)
            }
        } catch { }
    }

    useEffect(() => {
        check()
    }, [applicationId])

    // Realtime listener
    useDocumentRequests(applicationId, () => {
        check()
    })

    if (count === 0) return null

    return (
        <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
            {count}
        </Badge>
    )
}
