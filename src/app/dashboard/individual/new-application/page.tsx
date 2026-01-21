
import { Metadata } from 'next'
import NewApplicationClient from './client-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'New Application | Docufieds',
    description: 'Create a new visa document application',
}

export default function NewApplicationPage() {
    return <NewApplicationClient />
}
