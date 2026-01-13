'use client'

import {
    FileText,
    BadgeCheck,
    Languages,
    CalendarDays,
    Truck,
    ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const services = [
    {
        title: 'Visa Application',
        description: 'Complete assistance with visa application forms and ongoing guidance.',
        icon: FileText,
    },
    {
        title: 'Document Verification',
        description: 'Thorough review and attestation of all your supporting documents.',
        icon: BadgeCheck,
    },
    {
        title: 'Translation Services',
        description: 'Certified translation of documents into required languages.',
        icon: Languages,
    },
    {
        title: 'Embassy Appointments',
        description: 'Hassle-free scheduling of embassy interviews and submission slots.',
        icon: CalendarDays,
    },
    {
        title: 'Courier Coordination',
        description: 'Secure pickup and delivery of your documents right to your doorstep.',
        icon: Truck,
    },
    {
        title: 'Expert Review',
        description: 'Final check by visa experts to minimize rejection risks.',
        icon: ShieldCheck,
    },
]

export function ServicesOverview() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-brand-primary">Our Services</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Comprehensive Visa Solutions
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        From initial application to final document delivery, we handle every step of your visa process with precision and care.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                    <service.icon className="h-6 w-6 text-brand-primary" />
                                </div>
                                <CardTitle className="text-xl">{service.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    {service.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
