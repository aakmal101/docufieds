'use client'

import { ApplicationsDataTable } from '@/components/agency/applications/applications-data-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function ApplicationsPage() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                    <p className="text-muted-foreground mt-1">View and manage all your visa applications.</p>
                </div>
                <Link href="/dashboard/agency/new-application">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Application
                    </Button>
                </Link>
            </div>

            <ApplicationsDataTable />
        </div>
    )
}
