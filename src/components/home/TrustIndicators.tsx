'use client'

import { FileCheck, Globe2, Users, Trophy } from 'lucide-react'

const stats = [
    {
        id: 1,
        name: 'Documents Processed',
        value: '10,000+',
        icon: FileCheck,
        description: 'Successfully handled',
    },
    {
        id: 2,
        name: 'Success Rate',
        value: '98%',
        icon: Trophy,
        description: 'Approval record',
    },
    {
        id: 3,
        name: 'Countries Supported',
        value: '50+',
        icon: Globe2,
        description: 'Global destinations',
    },
    {
        id: 4,
        name: 'Years in Service',
        value: '5+',
        icon: Users,
        description: 'Industry experience',
    },
]

export function TrustIndicators() {
    return (
        <div className="bg-white py-12 sm:py-16 border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.id} className="mx-auto flex max-w-xs flex-col gap-y-4">
                            <div className="mx-auto p-3 bg-brand-50 rounded-full">
                                <stat.icon className="h-6 w-6 text-brand-primary" />
                            </div>
                            <dt className="text-base leading-7 text-gray-600">{stat.name}</dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                                {stat.value}
                            </dd>
                            <p className="text-sm text-gray-500">{stat.description}</p>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    )
}
