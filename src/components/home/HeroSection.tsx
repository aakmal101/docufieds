'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Stamp, Files } from 'lucide-react'

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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] flex items-center justify-center">
              <img
                src="/hero-image.png"
                alt="Visa Document Processing"
                className="w-full h-auto object-contain rounded-lg animate-float"
              />

              {/* Floating Module 1: Documents Notarized */}
              <div className="absolute -left-4 top-12 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-float shadow-brand-100/50" style={{ animationDuration: '5s', animationDelay: '0s' }}>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Stamp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Verified</p>
                  <p className="text-sm font-bold text-gray-900">Documents Notarized</p>
                </div>
              </div>

              {/* Floating Module 2: Documents Merged */}
              <div className="absolute -left-8 bottom-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-float shadow-brand-100/50" style={{ animationDuration: '7s', animationDelay: '1s' }}>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Files className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Organized</p>
                  <p className="text-sm font-bold text-gray-900">Documents Merged</p>
                </div>
              </div>

              {/* Floating Module 3: Application Ready */}
              <div className="absolute -right-6 top-1/2 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-float shadow-brand-100/50" style={{ animationDuration: '6s', animationDelay: '2s' }}>
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Hassle-free</p>
                  <p className="text-sm font-bold text-gray-900">Application Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
