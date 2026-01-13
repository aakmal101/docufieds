'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageCircle } from 'lucide-react'

export function CallToAction() {
    return (
        <section className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to start your journey?
                        <br />
                        Let us handle the paperwork.
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                        Join thousands of satisfied travelers who trusted Docufieds for a seamless visa application experience.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/auth/signup">
                            <Button size="lg" className="bg-brand-primary hover:bg-brand-secondary text-lg h-12 px-8">
                                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg h-12 px-8">
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Chat on WhatsApp
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-8 text-sm text-gray-400">
                        <p>Or visit our office: House 12, Road 5, Block B, Dhaka, Bangladesh</p>
                    </div>
                </div>
            </div>
            <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl" aria-hidden="true">
                <div
                    className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-brand-primary to-purple-500 opacity-25"
                    style={{
                        clipPath:
                            'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
                    }}
                />
            </div>
        </section>
    )
}
