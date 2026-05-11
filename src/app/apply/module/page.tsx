'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { User, GraduationCap, Briefcase, HeartPulse, Plane, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

// Business / Work is the only active module. All others are coming soon.
const MODULES = [
    {
        id: 'BUSINESS',
        title: 'Business / Work',
        description: 'For corporate trips, meetings, or employment opportunities.',
        icon: Briefcase,
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200',
        comingSoon: false
    },
    // ── Coming Soon modules (preserved for future integration) ──
    {
        id: 'PERSONAL',
        title: 'Personal / Tourism',
        description: 'For individuals visiting for tourism, family visits, or personal reasons.',
        icon: User,
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200',
        comingSoon: true
    },
    {
        id: 'EDUCATION',
        title: 'Education / Student',
        description: 'For students applying for universities, language schools, or academic programs.',
        icon: GraduationCap,
        color: 'bg-green-50 text-green-600',
        borderColor: 'border-green-200',
        comingSoon: true
    },
    {
        id: 'HEALTH',
        title: 'Health / Medical',
        description: 'For patients seeking medical treatment or consultations abroad.',
        icon: HeartPulse,
        color: 'bg-red-50 text-red-600',
        borderColor: 'border-red-200',
        comingSoon: true
    },
    {
        id: 'TRAVEL',
        title: 'Group Travel',
        description: 'For organized tour groups or large family vacations.',
        icon: Plane,
        color: 'bg-orange-50 text-orange-600',
        borderColor: 'border-orange-200',
        comingSoon: true
    }
]

export default function ModuleSelectionPage() {
    const router = useRouter()

    const handleSelectModule = (moduleId: string) => {
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
                        whileTap={module.comingSoon ? {} : { scale: 0.98 }}
                        className={module.comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'}
                        onClick={() => {
                            if (!module.comingSoon) handleSelectModule(module.id)
                        }}
                    >
                        <Card className={`h-full border-2 hover:border-blue-500 transition-colors ${module.borderColor} bg-white hover:shadow-lg relative overflow-hidden`}>
                            {/* Coming Soon badge — keeps original card colors intact */}
                            {module.comingSoon && (
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge className="bg-gray-800/80 text-white text-xs font-semibold gap-1 backdrop-blur-sm">
                                        <Lock className="w-3 h-3" />
                                        Coming Soon
                                    </Badge>
                                </div>
                            )}
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
                                {module.comingSoon ? (
                                    <Button className="w-full" variant="ghost" disabled>
                                        Coming Soon
                                    </Button>
                                ) : (
                                    <Button className="w-full" variant="ghost">
                                        Select {module.title.split('/')[0]} &rarr;
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

