'use client'

import { DedicatedSupportChat } from '@/components/user/DedicatedSupportChat'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DedicatedChatPage({ params }: { params: { id: string } }) {
    const router = useRouter()

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Application
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Support Chat</h1>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
                <DedicatedSupportChat applicationId={params.id} />
            </div>
        </div>
    )
}
