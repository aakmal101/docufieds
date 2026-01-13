'use client'

import { Laptop, Upload, Settings, CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const steps = [
    {
        id: '01',
        name: 'Submit Requirements',
        description: 'Fill out our simple online form with your travel details.',
        icon: Laptop,
        color: 'bg-blue-50 text-blue-600',
    },
    {
        id: '02',
        name: 'Upload Documents',
        description: 'Securely upload your scanned documents to our portal.',
        icon: Upload,
        color: 'bg-indigo-50 text-indigo-600',
    },
    {
        id: '03',
        name: 'Processing & Verify',
        description: 'Our experts verify and process your application.',
        icon: Settings,
        color: 'bg-purple-50 text-purple-600',
    },
    {
        id: '04',
        name: 'Receive Documents',
        description: 'Get your ready-to-submit documents digitally or by courier.',
        icon: CheckCircle,
        color: 'bg-green-50 text-green-600',
    },
]

export function HowItWorks() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-gray-600">
                            A simple 4-step process to get your visa documents ready.
                        </p>
                    </motion.div>
                </div>

                <div className="relative">
                    {/* Visual Connector Line for Desktop */}
                    <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-100 via-purple-100 to-green-100 -z-10" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                className="relative flex flex-col items-center text-center group"
                            >
                                <div className={cn(
                                    "flex h-32 w-32 items-center justify-center rounded-full border-4 border-white shadow-lg mb-8 transition-transform duration-300 group-hover:scale-110",
                                    step.color
                                )}>
                                    <step.icon className="h-12 w-12" aria-hidden="true" />
                                </div>

                                <div className="space-y-3">
                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-sm font-semibold text-gray-600 mb-2">
                                        Step {step.id}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                                        {step.name}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow for mobile/tablet flow hint */}
                                {index < steps.length - 1 && (
                                    <div className="lg:hidden mt-8 text-gray-300">
                                        <ArrowRight className="h-6 w-6 transform rotate-90 md:rotate-0" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
