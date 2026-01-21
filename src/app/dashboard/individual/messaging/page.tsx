
import { Metadata } from 'next'
import MessagingClient from './client-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Messages | Docufieds',
    description: 'View your messages and support chats',
}

export default function MessagingPage() {
    return <MessagingClient />
}
