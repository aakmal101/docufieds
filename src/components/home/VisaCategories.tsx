'use client'

import { MapPin, ArrowRight, ArrowUpRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const categories = [
    {
        name: 'USA',
        count: 'Tourist & Business',
        code: 'us',
        color: 'bg-blue-50 text-blue-600',
    },
    {
        name: 'UK',
        count: 'Standard Visitor',
        code: 'gb',
        color: 'bg-red-50 text-red-600',
    },
    {
        name: 'Canada',
        count: 'Visitor Visa',
        code: 'ca',
        color: 'bg-red-50 text-red-600',
    },
    {
        name: 'Schengen',
        count: '26 Countries',
        code: 'eu',
        color: 'bg-indigo-50 text-indigo-600',
    },
    {
        name: 'Australia',
        count: 'Visitor Visa (600)',
        code: 'au',
        color: 'bg-amber-50 text-amber-600',
    },
    {
        name: 'Thailand',
        count: 'Tourist Visa',
        code: 'th',
        color: 'bg-purple-50 text-purple-600',
    },
    {
        name: 'Malaysia',
        count: 'eVISA',
        code: 'my',
        color: 'bg-orange-50 text-orange-600',
    },
    {
        name: 'Singapore',
        count: 'Tourist Visa',
        code: 'sg',
        color: 'bg-rose-50 text-rose-600',
    },
]

export function VisaCategories() {
    return (
        <section className="py-24 bg-gray-50 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Popular Destinations
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
                            We support visa applications for over 50+ countries. Choose your destination and let us handle the rest.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="hidden sm:block"
                    >
                        <Link href="/services">
                            <Button variant="ghost" className="text-brand-primary hover:text-brand-secondary hover:bg-brand-50 group">
                                View all countries <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <div
                                className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-brand-100 transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105", category.color)}>
                                        <img
                                            src={`https://flagcdn.com/${category.code}.svg`}
                                            alt={`${category.name} flag`}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-brand-primary transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">{category.count}</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-brand-primary transition-colors duration-300" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-10 sm:hidden">
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
