'use client'

import { useAgencyAnalyticsOverview } from '@/lib/hooks/use-agency-analytics'
import { useAgencyApplicationStats } from '@/lib/hooks/use-agency-applications'
import { CreditStatusCard } from '@/components/agency/credit/credit-status-card'
import { MetricCard } from '@/components/agency/analytics/metric-card'
import { ApplicationsByCountryChart } from '@/components/agency/analytics/applications-by-country-chart'
import { MonthlyTrendChart } from '@/components/agency/analytics/monthly-trend-chart'
import { StatusDistributionChart } from '@/components/agency/analytics/status-distribution-chart'
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AgencyDashboard() {
  const [period, setPeriod] = useState('thisMonth')
  const { data: analyticsData } = useAgencyAnalyticsOverview({ period })
  const { data: statsData } = useAgencyApplicationStats()

  const metrics = analyticsData?.data?.metrics
  const stats = statsData?.data

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your performance overview.</p>
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

      <div className="grid gap-6 md:grid-cols-12">
        {/* Credit Status - Takes up 4 columns on large screens */}
        <div className="md:col-span-4">
          <CreditStatusCard />
        </div>

        {/* Metrics Grid - Takes up 8 columns */}
        <div className="md:col-span-8 grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div className="space-y-4">
            <MetricCard
              title="Total Applications"
              value={metrics?.totalApplications || 0}
              icon={FileText}
              description={`In ${period.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            />
            <MetricCard
              title="Success Rate"
              value={`${stats?.successRate || 0}%`}
              icon={CheckCircle}
              description="All time average"
            />
          </div>
          <div className="space-y-4">
            <MetricCard
              title="Revenue Generated"
              value={`$${metrics?.totalRevenue?.toFixed(2) || 0}`}
              icon={DollarSign}
              description="Paid invoices"
            />
            <MetricCard
              title="Pending Payments"
              value={`$${metrics?.pendingPayments?.toFixed(2) || 0}`}
              icon={Clock}
              description="Outstanding invoices"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ApplicationsByCountryChart period={period} />
        <MonthlyTrendChart months={6} />
        <StatusDistributionChart period={period} />
      </div>
    </div>
  )
}
