'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your admin preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Comimg Soon</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Settings configuration will be available in the next update.</p>
                </CardContent>
            </Card>
        </div>
    )
}
