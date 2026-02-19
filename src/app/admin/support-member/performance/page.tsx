'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, TrendingUp, CheckCircle, Clock, FileText, Activity } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const WeeklyActivityChart = dynamic(
    () => import('@/components/support-member/weekly-activity-chart').then(m => ({ default: m.WeeklyActivityChart })),
    { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" /> }
)
const StatusPieChart = dynamic(
    () => import('@/components/support-member/status-pie-chart').then(m => ({ default: m.StatusPieChart })),
    { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" /> }
)

export default function PerformanceDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/support-member/performance')
                if (res.ok) {
                    setStats(await res.json())
                }
            } catch (error) {
                console.error(error)
                toast.error('Failed to load performance data')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Performance</h1>
                <p className="text-gray-500">Track your efficiency and impact over time.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                        <FileText className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.total}</div>
                        <p className="text-xs text-gray-500">Applications assigned</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Workload</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.active}</div>
                        <p className="text-xs text-gray-500">Currently in progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.completed}</div>
                        <p className="text-xs text-gray-500">Successfully closed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.rate}%</div>
                        <p className="text-xs text-gray-500">Of total assignments</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WeeklyActivityChart data={stats.weeklyActivity} />
                <StatusPieChart data={stats.statusDistribution} />
            </div>
        </div>
    )
}
