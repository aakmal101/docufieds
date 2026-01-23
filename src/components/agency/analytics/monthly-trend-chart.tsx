'use client'

import { useAgencyMonthlyTrend } from '@/lib/hooks/use-agency-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function MonthlyTrendChart({ months = 6 }: { months?: number }) {
    const { data, isLoading } = useAgencyMonthlyTrend(months)

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Application Trends</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">Loading chart...</CardContent>
            </Card>
        )
    }

    const chartData = data?.data || []

    return (
        <Card>
            <CardHeader>
                <CardTitle>Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="applications" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
