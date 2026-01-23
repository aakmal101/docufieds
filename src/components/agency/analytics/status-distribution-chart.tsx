'use client'

import { useAgencyStatusDistribution } from '@/lib/hooks/use-agency-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function StatusDistributionChart({ period = 'thisMonth' }: { period?: string }) {
    const { data, isLoading } = useAgencyStatusDistribution(period)

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">Loading chart...</CardContent>
            </Card>
        )
    }

    const chartData = data?.data || []

    return (
        <Card>
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{
                            top: 5,
                            right: 30,
                            left: 40,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="status" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={
                                    entry.status === 'Completed' ? '#22c55e' :
                                        entry.status === 'Declined' ? '#ef4444' :
                                            '#3b82f6'
                                } />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
