'use client'

import { MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const categories = [
    {
        name: 'USA',
        count: 'Tourist & Business',
        color: 'bg-blue-50 text-blue-700',
    },
    {
        name: 'UK',
        count: 'Standard Visitor',
        color: 'bg-red-50 text-red-700',
    },
    {
        name: 'Canada',
        count: 'Visitor Visa',
        color: 'bg-red-50 text-red-700',
    },
    {
        name: 'Schengen',
        count: '26 Countries',
        color: 'bg-indigo-50 text-indigo-700',
    },
    {
        name: 'Australia',
        count: 'Visitor Visa (600)',
        color: 'bg-yellow-50 text-yellow-700',
    },
    {
        name: 'Thailand',
        count: 'Tourist Visa',
        color: 'bg-purple-50 text-purple-700',
    },
    {
        name: 'Malaysia',
        count: 'eVISA',
        color: 'bg-orange-50 text-orange-700',
    },
    {
        name: 'Singapore',
        count: 'Tourist Visa',
        color: 'bg-red-50 text-red-700',
    },
]

export function VisaCategories() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Popular Destinations
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            We support visa applications for over 50+ countries.
                        </p>
                    </div>
                    <Link href="/services" className="hidden sm:block">
                        <Button variant="ghost" className="text-brand-primary hover:text-brand-secondary hover:bg-brand-50">
                            View all countries <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <div
                            key={category.name}
                            className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.color}`}>
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{category.count}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 sm:hidden">
                    <Link href="/services">
                        <Button className="w-full" variant="outline">
                            View all countries
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
