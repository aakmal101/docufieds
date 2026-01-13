'use client'

import { Laptop, Upload, Settings, CheckCircle } from 'lucide-react'

const steps = [
    {
        id: '01',
        name: 'Submit Requirements',
        description: 'Fill out our simple online form with your travel details.',
        icon: Laptop,
    },
    {
        id: '02',
        name: 'Upload Documents',
        description: 'Securely upload your scanned documents to our portal.',
        icon: Upload,
    },
    {
        id: '03',
        name: 'Processing & Verify',
        description: 'Our experts verify and process your application.',
        icon: Settings,
    },
    {
        id: '04',
        name: 'Receive Documents',
        description: 'Get your ready-to-submit documents digitally or by courier.',
        icon: CheckCircle,
    },
]

export function HowItWorks() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-20">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        How It Works
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        A simple 4-step process to get your visa documents ready.
                    </p>
                </div>

                <div className="relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative flex flex-col items-center text-center bg-white p-4">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 border-4 border-white shadow-sm mb-6">
                                    <step.icon className="h-10 w-10 text-brand-primary" aria-hidden="true" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                                        {step.id}
                                    </span>
                                    <h3 className="text-xl font-semibold text-gray-900">{step.name}</h3>
                                </div>
                                <p className="text-gray-600">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
