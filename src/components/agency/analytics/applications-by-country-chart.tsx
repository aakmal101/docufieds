'use client'

import { useAgencyApplicationsByCountry } from '@/lib/hooks/use-agency-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

export function ApplicationsByCountryChart({ period = 'thisMonth' }: { period?: string }) {
    const { data, isLoading } = useAgencyApplicationsByCountry(period)

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Applications by Country</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">Loading chart...</CardContent>
            </Card>
        )
    }

    const chartData = data?.data || []

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Applications by Country</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Applications by Country</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
