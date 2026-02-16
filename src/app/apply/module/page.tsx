'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { User, GraduationCap, Briefcase, HeartPulse, Plane } from 'lucide-react'
import { motion } from 'framer-motion'

// We'll use string literals matching the enum to avoid client-side import issues with Enums sometimes
const MODULES = [
    {
        id: 'PERSONAL',
        title: 'Personal / Tourism',
        description: 'For individuals visiting for tourism, family visits, or personal reasons.',
        icon: User,
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200'
    },
    {
        id: 'EDUCATION',
        title: 'Education / Student',
        description: 'For students applying for universities, language schools, or academic programs.',
        icon: GraduationCap,
        color: 'bg-green-50 text-green-600',
        borderColor: 'border-green-200'
    },
    {
        id: 'BUSINESS',
        title: 'Business / Work',
        description: 'For corporate trips, meetings, or employment opportunities.',
        icon: Briefcase,
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200'
    },
    {
        id: 'HEALTH',
        title: 'Health / Medical',
        description: 'For patients seeking medical treatment or consultations abroad.',
        icon: HeartPulse,
        color: 'bg-red-50 text-red-600',
        borderColor: 'border-red-200'
    },
    {
        id: 'TRAVEL',
        title: 'Group Travel',
        description: 'For organized tour groups or large family vacations.',
        icon: Plane,
        color: 'bg-orange-50 text-orange-600',
        borderColor: 'border-orange-200'
    }
]

export default function ModuleSelectionPage() {
    const router = useRouter()

    const handleSelectModule = (moduleId: string) => {
        // Store selected module in localStorage or URL query param for the next step
        // For simplicity and resilience, we can use a query param on the next route
        // Or save to a context if one exists.
        // Let's pass it via URL query param to /apply/country for now, or /apply/start

        // We need to know WHERE the flow goes next. User said: 
        // "On module select... Redirect to existing country selector page"
        // Assuming /apply/country is that page, or /apply if that IS the country selector.
        // Checking file structure earlier, /apply/page.tsx likely was the start.
        // If we change /apply/page.tsx to redirect HERE, then the country selector might need to move to /apply/country
        // OR we redirect to /apply/country?module=PERSONAL

        // Strategy:
        // 1. User visits /apply -> Redirects to /apply/module (This page).
        // 2. User selects Module -> Redirects to /apply/country?module=PERSONAL.
        // 3. Country page reads param.

        // Redirect to the existing New Application page with the selected module
        router.push(`/dashboard/individual/new-application?module=${moduleId}`)
    }

    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Select Application Type</h1>
                <p className="text-gray-500 mt-2">Choose the category that best describes your purpose of travel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULES.map((module) => (
                    <motion.div
                        key={module.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer"
                        onClick={() => handleSelectModule(module.id)}
                    >
                        <Card className={`h-full border-2 hover:border-blue-500 transition-colors ${module.borderColor} bg-white hover:shadow-lg`}>
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-4`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl">{module.title}</CardTitle>
                                <CardDescription className="text-sm mt-2">
                                    {module.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" variant="ghost">
                                    Select {module.title.split('/')[0]} &rarr;
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
