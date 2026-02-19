'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE']

export function StatusPieChart({ data }: { data: any[] }) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown of current application statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                    {data.map((entry: any, index: number) => (
                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-gray-600">{entry.name} ({entry.value})</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
