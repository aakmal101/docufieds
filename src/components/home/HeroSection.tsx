'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-24 lg:pb-28">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <svg
          width="800"
          height="800"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="400" cy="400" r="400" fill="url(#hero-gradient)" />
          <defs>
            <radialGradient
              id="hero-gradient"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(400 400) rotate(90) scale(400)"
            >
              <stop stopColor="#E83234" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
              Your Visa Documents,{' '}
              <span className="text-brand-primary block">Handled Right</span>
            </h1>
            <p className="text-lg leading-8 text-gray-600 mb-8">
              Stress-free visa documentation starts here. We verify, translate, and process your documents with speed and accuracy, so you can focus on your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-brand-primary hover:bg-brand-secondary text-lg h-12 px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#requirements">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8">
                  Check Requirements
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center gap-x-6">
              <div className="flex items-center gap-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">98% Success Rate</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">24/7 Support</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Secure Handling</span>
              </div>
            </div>
          </div>

          <div className="relative lg:h-[600px] hidden lg:block">
            {/* Abstract Document Visuals */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] max-h-[500px]">
              {/* Main Card */}
              <div className="absolute top-10 left-10 right-10 bottom-10 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 z-20">
                <div className="h-4 w-32 bg-gray-100 rounded mb-8"></div>
                <div className="space-y-4">
                  <div className="h-3 w-full bg-gray-50 rounded"></div>
                  <div className="h-3 w-5/6 bg-gray-50 rounded"></div>
                  <div className="h-3 w-4/6 bg-gray-50 rounded"></div>
                </div>
                <div className="mt-8 flex gap-4">
                  <div className="h-20 w-20 bg-brand-50 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 space-y-3 pt-2">
                    <div className="h-2 w-full bg-gray-50 rounded"></div>
                    <div className="h-2 w-2/3 bg-gray-50 rounded"></div>
                  </div>
                </div>
                {/* Floating Badge */}
                <div className="absolute -right-6 top-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce z-30">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700">Verified</span>
                  </div>
                </div>
              </div>
              
              {/* Background Cards for Depth */}
              <div className="absolute top-0 left-20 right-0 bottom-20 bg-gray-50 rounded-2xl -z-10 transform rotate-6 border border-gray-100"></div>
              <div className="absolute top-20 left-0 right-20 bottom-0 bg-brand-50 rounded-2xl -z-20 transform -rotate-3 border border-brand-100"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
