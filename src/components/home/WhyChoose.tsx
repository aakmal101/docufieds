'use client'

import {
    ShieldCheck,
    Clock,
    CreditCard,
    Lock,
    Search
} from 'lucide-react'

const features = [
    {
        name: 'Expert Document Review',
        description: 'Our specialists double-check every document to ensure it meets embassy standards, reducing rejection risk.',
        icon: ShieldCheck,
    },
    {
        name: 'Fast Turnaround Time',
        description: 'We prioritize speed without compromising quality, ensuring you meet your travel timelines.',
        icon: Clock,
    },
    {
        name: 'Transparent Pricing',
        description: 'No hidden fees. You know exactly what you are paying for from the start.',
        icon: CreditCard,
    },
    {
        name: 'Secure Handling',
        description: 'Bank-grade security protocols to protect your sensitive personal data and documents.',
        icon: Lock,
    },
    {
        name: 'Real-time Tracking',
        description: 'Stay updated on your application status every step of the way via our portal.',
        icon: Search,
    },
]

export function WhyChoose() {
    return (
        <section className="py-24 bg-brand-primary text-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-white/80">Why Choose Us</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Experience the Docufieds Difference
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                    <feature.icon className="h-5 w-5 flex-none text-white/80" aria-hidden="true" />
                                    {feature.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-docufieds-100">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    )
}
