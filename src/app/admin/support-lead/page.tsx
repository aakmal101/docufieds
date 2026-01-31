'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Inbox, Activity, AlertTriangle, CheckCircle, Clock, XCircle, BarChart3, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AutoAssignToggle } from '@/components/support/AutoAssignToggle'
import { AutoAssignConfigModal } from '@/components/support/AutoAssignConfigModal'
import { useApplicationAssignments, useEscalations, useRejectionRequests } from '@/lib/supabase/realtime-support'

export default function SupportLeadDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        pendingAssignment: 0,
        activeProcessing: 0,
        escalations: 0,
        pendingRejections: 0,
        completedToday: 0,
        avgProcessingTime: '--'
    })

    // Auto-Assign State
    const [aaConfig, setAaConfig] = useState<any>(null)
    const [aaModalOpen, setAaModalOpen] = useState(false)

    // Realtime Hooks
    // Note: We need a way to know the 'leadId' or just listen broadly? 
    // The hooks expect an ID. For the Dashboard overview, we might just want to listen to EVERYTHING?
    // Or we rely on the hooks refreshing the router which re-runs the page load?
    // Actually the hooks use `router.refresh()` which refreshes server components.
    // Client components like this one need to re-fetch manually.
    // So we'll pass a callback to refetch stats.

    // Simplification: We listen to ANY change on assignments/escalations for now to trigger refetch
    // But hooks need an ID. Let's assume we can pass 'GLOBAL' or similar if we modify hooks, 
    // or just listen to the table generally without filter? 
    // My hooks implemented filters. 
    // Let's modify the usage: We can't use `useEscalations` easily without a lead ID if looking for all.
    // However, the `fetchStats` is what we want to re-run.
    // For now, let's just use a simple polling fallback OR assume the user ID is available?
    // Wait, this is a dashboard. Polling is safer if we don't have the ID handy (it's in session but client doesn't know it easily unless passed).
    // Actually, I can allow the hooks to accept 'any' or modify them to not filter if ID is null?
    // Let's just implement polling for the stats since it's an aggregation.
    // Realtime is more useful for lists (Escalations page, Messaging).

    // But the task said: "In /admin/support-lead/page.tsx: Refresh stats on assignment changes"
    // I will add a poller for now as it's robust.

    useEffect(() => {
        async function load() {
            try {
                const [resStats, resConfig] = await Promise.all([
                    fetch('/api/admin/support-lead/dashboard'),
                    fetch('/api/admin/support-lead/config/auto-assign')
                ])

                if (resStats.ok) setStats(await resStats.json())
                if (resConfig.ok) setAaConfig(await resConfig.json())
            } catch {
                toast.error('Error loading dashboard')
            } finally {
                setLoading(false)
            }
        }
        load()

        // Polling interval for stats (simple realtime substitute for aggregation)
        const interval = setInterval(load, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleAaToggle = async (val: boolean) => {
        // Optimistic update
        const old = aaConfig
        setAaConfig({ ...aaConfig, isEnabled: val })

        try {
            await fetch('/api/admin/support-lead/config/auto-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...aaConfig, isEnabled: val })
            })
            toast.success(`Auto-Assign ${val ? 'Enabled' : 'Disabled'}`)
        } catch {
            setAaConfig(old)
            toast.error('Failed to update settings')
        }
    }

    const handleAaSave = async (newConfig: any) => {
        try {
            const res = await fetch('/api/admin/support-lead/config/auto-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            })
            if (res.ok) {
                setAaConfig(await res.json())
                toast.success('Configuration saved')
            }
        } catch {
            toast.error('Failed to save configuration')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    // Mock activity data
    const recentActivity = [
        { id: 1, user: 'System', action: 'received 15 new applications', time: '1 hour ago' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500">Welcome back, Support Lead. Here is what needs attention today.</p>
                </div>

                {aaConfig && (
                    <AutoAssignToggle
                        isEnabled={aaConfig.isEnabled}
                        onToggle={handleAaToggle}
                        onOpenConfig={() => setAaModalOpen(true)}
                    />
                )}
            </div>

            <AutoAssignConfigModal
                isOpen={aaModalOpen}
                onClose={() => setAaModalOpen(false)}
                config={aaConfig}
                onSave={handleAaSave}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card
                    className="border-l-4 border-l-yellow-400 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => window.location.href = '/admin/support-lead/applications?status=PENDING'} // Using window.location to force full reload if needed, or better router.push
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase">Pending</span>
                            <div className="flex justify-between items-center mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.pendingAssignment}</h3>
                                <Inbox className="h-5 w-5 text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => window.location.href = '/admin/support-lead/applications?status=PROCESSING'}
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase">Processing</span>
                            <div className="flex justify-between items-center mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.activeProcessing}</h3>
                                <Activity className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => window.location.href = '/admin/support-lead/escalations'}
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase">Escalated</span>
                            <div className="flex justify-between items-center mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.escalations}</h3>
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => window.location.href = '/admin/support-lead/rejections'}
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase">Rejections</span>
                            <div className="flex justify-between items-center mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.pendingRejections}</h3>
                                <XCircle className="h-5 w-5 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => window.location.href = '/admin/support-lead/applications?status=COMPLETED'}
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase">Completed</span>
                            <div className="flex justify-between items-center mt-2">
                                <h3 className="text-2xl font-bold text-gray-900">{stats.completedToday}</h3>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => window.location.href = '/admin/support-lead/reports'}
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase">Avg Time</span>
                            <div className="flex justify-between items-center mt-2">
                                <h3 className="text-xl font-bold text-gray-900">{stats.avgProcessingTime}</h3>
                                <Clock className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Performance Placeholder */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                        <CardDescription>Applications processed this week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                            <div className="text-center text-gray-400">
                                <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                                <p>Performance Chart Component</p>
                                <p className="text-xs">Coming in Phase 4</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions from your team</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-0 last:pb-0">
                                    <div className="mt-1">
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800">
                                            <span className="font-semibold">{activity.user}</span> {activity.action}
                                        </p>
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {activity.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
