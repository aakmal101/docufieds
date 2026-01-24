'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, CheckCircle, AlertTriangle, UserPlus, XCircle, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function EscalationsPage() {
    const [escalations, setEscalations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [resolving, setResolving] = useState<string | null>(null)

    const fetchEscalations = async () => {
        try {
            const res = await fetch('/api/admin/support-lead/escalations')
            if (res.ok) setEscalations(await res.json())
        } catch (error) {
            toast.error('Failed to load escalations')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchEscalations() }, [])

    const handleResolve = async (id: string, action: string) => {
        setResolving(id)
        try {
            const res = await fetch(`/api/admin/support-lead/escalations/${id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    resolution: action === 'DISMISS' ? 'Dismissed' : 'Lead decision'
                })
            })
            if (res.ok) {
                toast.success('Escalation resolved')
                fetchEscalations()
            } else {
                toast.error('Failed')
            }
        } catch { toast.error('Error') }
        finally { setResolving(null) }
    }

    const getPriorityColor = (p: string) => {
        if (p === 'URGENT') return 'destructive' // red
        if (p === 'HIGH') return 'outline' // maybe orange if custom, fallback outline
        return 'secondary'
    }

    const pending = escalations.filter(e => e.status === 'PENDING')
    const resolved = escalations.filter(e => e.status !== 'PENDING')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Escalations</h1>
                    <p className="text-gray-500">Manage urgent issues raised by your team.</p>
                </div>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                    {loading ? <Loader2 className="animate-spin" /> : pending.length === 0 ? <p className="text-gray-500">No pending escalations.</p> :
                        pending.map(item => (
                            <Card key={item.id} className="border-l-4 border-l-red-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={item.priority === 'URGENT' ? 'destructive' : 'outline'}>{item.priority}</Badge>
                                                <span className="text-xs text-gray-400">Escalated {formatDistanceToNow(new Date(item.escalatedAt))} ago</span>
                                            </div>
                                            <CardTitle className="text-lg">Application #{item.application.id.substring(0, 8)}</CardTitle>
                                            <CardDescription>{item.application.processType} - {item.application.country}</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">Escalated By</div>
                                            <div className="flex items-center justify-end gap-2 mt-1">
                                                <span className="text-sm text-gray-600">{item.escalatedBy.fullName}</span>
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={item.escalatedBy.photoUrl} />
                                                    <AvatarFallback>{item.escalatedBy.fullName[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-red-50 p-3 rounded mb-4 text-sm text-red-900">
                                        <span className="font-semibold">Reason:</span> {item.reason}
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Link href={`/admin/support-member/applications/${item.application.id}`}>
                                            <Button variant="ghost" size="sm">View Application</Button>
                                        </Link>
                                        <Button variant="outline" size="sm" onClick={() => handleResolve(item.id, 'DISMISS')}>Dismiss</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleResolve(item.id, 'REASSIGN')}>Reassign</Button>
                                        <Button size="sm" onClick={() => handleResolve(item.id, 'TAKE_OVER')}>Take Over</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </TabsContent>

                <TabsContent value="resolved" className="mt-4">
                    {/* Simple list for resolved */}
                    <p className="text-gray-500 italic">Resolved history view...</p>
                </TabsContent>
            </Tabs>
        </div>
    )
}
