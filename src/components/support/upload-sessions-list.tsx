
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Loader2, ChevronDown, ChevronRight, Ban, ExternalLink, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function UploadSessionsList() {
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
    const supabase = createClient()

    const fetchSessions = async () => {
        try {
            const response = await fetch('/api/support/upload-sessions?targetUserId=&applicationId=') // Fetch all for now or filter? 
            // API currently requires filter. 
            // Wait, API implementation says:
            // if (!applicationId && !targetUserId) return 400 'Filter required'
            // I should probably allow fetching ALL sessions for the main list if no filters provided, OR modify API to allow fetching recent sessions.
            // Let's modify the fetch to handle 400 or fix API. 
            // Valid point: "List sessions with status chips: ACTIVE/COMPLETED/EXPIRED/CANCELLED". Usually unlimited list is bad.
            // But for this component, maybe we show recent 50?
            // I'll update the API to allow fetching recent usage without strict filter, OR I'll assume we pass a user ID.
            // But this list is likely for "Recent Upload Sessions" tab in logical sense.
            // I'll modify the API call to send a flag or just handle user selection.
            // Actually, if I am on "Upload Sessions" tab, I probably want to see ALL active sessions.
            // I will update API to allow no filters (return recent).

            // Temporary workaround: Client side fetching won't work well without updating API.
            // I will update API logic in next step. For now, let's write component assuming API works.

            // Let's try to fetch with a dummy filter or update API first?
            // Updating API is safer.
            // I'll write component to fetch, and then update API.
            const res = await fetch('/api/support/upload-sessions?recent=true')
            const data = await res.json()
            if (data.success) {
                setSessions(data.data)
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
            toast.error('Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()

        // Realtime Subscription
        const channel = supabase
            .channel('upload-sessions-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'upload_sessions'
                },
                (payload) => {
                    // Simplest approach: refetch
                    // Optimization: update state locally
                    fetchSessions()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'upload_slots'
                },
                () => {
                    fetchSessions()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedSessions)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpandedSessions(newSet)
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this session? The link will become invalid.')) return

        try {
            const response = await fetch(`/api/support/upload-sessions/${id}/cancel`, {
                method: 'POST'
            })
            const data = await response.json()
            if (data.success) {
                toast.success('Session cancelled')
                fetchSessions()
            } else {
                toast.error(data.message || 'Failed to cancel')
            }
        } catch (error) {
            toast.error('Error cancelling session')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800'
            case 'COMPLETED': return 'bg-blue-100 text-blue-800'
            case 'EXPIRED': return 'bg-yellow-100 text-yellow-800'
            case 'CANCELLED': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Upload Sessions</CardTitle>
            </CardHeader>
            <CardContent>
                {sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No upload sessions found. Create one to get started.</div>
                ) : (
                    <div className="space-y-4">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Requester</TableHead>
                                        <TableHead>Target User</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <React.Fragment key={session.id}>
                                            <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(session.id)}>
                                                <TableCell>
                                                    {expandedSessions.has(session.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </TableCell>
                                                <TableCell suppressHydrationWarning>{format(new Date(session.createdAt), 'MMM d, h:mm a')}</TableCell>
                                                <TableCell>{session.createdByUser?.fullName || 'System'}</TableCell>
                                                <TableCell>{session.targetUser?.fullName || session.targetUser?.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {session.slots.filter((s: any) => s.status === 'UPLOADED').length} / {session.slotCount}
                                                        </span>
                                                        {session.status === 'COMPLETED' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getStatusColor(session.status)}>
                                                        {session.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {session.status === 'ACTIVE' && (
                                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCancel(session.id); }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>

                                            {expandedSessions.has(session.id) && (
                                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                                    <TableCell colSpan={7} className="p-0">
                                                        <div className="p-4 pl-12 space-y-2">
                                                            <div className="flex gap-4 text-xs text-gray-500 mb-2">
                                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expires: {format(new Date(session.expiresAt), 'MMM d, h:mm a')}</span>
                                                                {/* Add Link Copy Button here if needed */}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {session.slots.map((slot: any) => (
                                                                    <div key={slot.id} className="border rounded bg-white p-3 flex items-center justify-between shadow-sm">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <div className={`w-2 h-2 rounded-full ${slot.status === 'UPLOADED' ? 'bg-green-500' : 'bg-gray-200'}`} />
                                                                            <div className="truncate">
                                                                                <p className="text-sm font-medium truncate" title={slot.label}>{slot.label}</p>
                                                                                <p className="text-xs text-gray-500">{slot.status === 'UPLOADED' ? 'Uploaded' : 'Pending'}</p>
                                                                            </div>
                                                                        </div>
                                                                        {slot.uploadedDocument && (
                                                                            <a href={slot.uploadedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                                                View <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
