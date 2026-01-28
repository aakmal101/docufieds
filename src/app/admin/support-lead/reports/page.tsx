'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Users, Clock, FileCheck, FileX, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

// Simple Bar Chart Component using CSS grid/flex for zero-dep visualization
const SimpleBarChart = ({ data }: { data: { date: string, count: number }[] }) => {
    if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400">No data available</div>

    const max = Math.max(...data.map(d => d.count), 1)

    return (
        <div className="flex items-end space-x-2 h-64 pt-6 pb-2">
            {data.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {item.count} Apps - {item.date}
                    </div>
                    {/* Bar */}
                    <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                        style={{ height: `${(item.count / max) * 100}%`, minHeight: '4px' }}
                    ></div>
                    {/* Label */}
                    <div className="text-[10px] text-gray-500 mt-2 rotate-45 origin-left translate-y-2 w-full truncate">
                        {item.date.slice(5)} {/* MM-DD */}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function ReportsPage() {
    const [range, setRange] = useState('30d')
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchReports = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/support-lead/reports?range=${range}`)
            if (res.ok) {
                setStats(await res.json())
            } else {
                toast.error('Failed to load reports')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error loading data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [range])

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Generating analytics...</p>
            </div>
        )
    }

    const kpis = stats?.kpis || {}
    const team = stats?.teamPerformance || []
    const chart = stats?.activityChart || []

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics & Reports</h1>
                    <p className="text-gray-500">Performance metrics and team efficiency insights.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchReports}>
                        <TrendingUp className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                        <FileCheck className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalApplications || 0}</div>
                        <p className="text-xs text-muted-foreground">Applications submitted</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{kpis.approvalRate}%</div>
                        <p className="text-xs text-muted-foreground">{kpis.rejectionRate}% rejection rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.avgProcessingHours}h</div>
                        <p className="text-xs text-muted-foreground">Assignment to completion</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Currently Pending</CardTitle>
                        <BarChart3 className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{kpis.pendingCount}</div>
                        <p className="text-xs text-muted-foreground">In pipeline right now</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Application Volume</CardTitle>
                        <CardDescription>Daily submission trend for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SimpleBarChart data={chart} />
                    </CardContent>
                </Card>

                {/* Team Leaderboard/Stats */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                        <CardDescription>Top contributors by volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {team.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No team data available</div>
                        ) : (
                            <div className="space-y-4">
                                {team.slice(0, 5).map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                                                {member.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.active} active</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">{member.assigned}</p>
                                            <p className="text-xs text-green-600">{member.efficiency}% eff.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Team Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Team Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Assigned (Period)</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead className="text-right">Efficiency</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {team.map((member: any) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.assigned}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.active > 5 ? "secondary" : "outline"}>
                                            {member.active}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{member.completed}</TableCell>
                                    <TableCell className="text-right font-bold text-gray-700">
                                        {member.efficiency}%
                                    </TableCell>
                                </TableRow>
                            ))}
                            {team.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                                        No team activity found in this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
