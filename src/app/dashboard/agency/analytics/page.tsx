'use client'

import { useState } from 'react'
import { useAgencyAnalyticsOverview } from '@/lib/hooks/use-agency-analytics'
import { useAgencyApplicationStats } from '@/lib/hooks/use-agency-applications'
import { MetricCard } from '@/components/agency/analytics/metric-card'
import { ApplicationsByCountryChart } from '@/components/agency/analytics/applications-by-country-chart'
import { MonthlyTrendChart } from '@/components/agency/analytics/monthly-trend-chart'
import { StatusDistributionChart } from '@/components/agency/analytics/status-distribution-chart'
import { FileText, CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('thisMonth')
    const { data: analyticsData, isLoading } = useAgencyAnalyticsOverview({ period })
    const { data: statsData } = useAgencyApplicationStats()

    const metrics = analyticsData?.data?.metrics
    const stats = statsData?.data

    if (isLoading) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold tracking-tight mb-6">Analytics</h1>
                <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground mt-1">View your agency performance metrics and trends.</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                        <SelectItem value="last3Months">Last 3 Months</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Applications"
                    value={metrics?.totalApplications || 0}
                    icon={FileText}
                    description={`In ${period.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                />
                <MetricCard
                    title="Completed"
                    value={metrics?.completedApplications || 0}
                    icon={CheckCircle}
                    description="Successfully processed"
                />
                <MetricCard
                    title="Success Rate"
                    value={`${stats?.successRate || 0}%`}
                    icon={TrendingUp}
                    description="All time average"
                />
                <MetricCard
                    title="Revenue"
                    value={`$${metrics?.totalRevenue?.toFixed(2) || 0}`}
                    icon={DollarSign}
                    description="From paid invoices"
                />
            </div>

            {/* Charts */}
            <h2 className="text-xl font-semibold mt-8 mb-4">Detailed Analytics</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ApplicationsByCountryChart period={period} />
                <MonthlyTrendChart months={6} />
                <StatusDistributionChart period={period} />
            </div>
        </div>
    )
}
