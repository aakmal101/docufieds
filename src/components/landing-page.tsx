'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroSection } from './home/HeroSection'
import { TrustIndicators } from './home/TrustIndicators'
import { ServicesOverview } from './home/ServicesOverview'
import { HowItWorks } from './home/HowItWorks'
import { VisaCategories } from './home/VisaCategories'
import { WhyChoose } from './home/WhyChoose'
import { Testimonials } from './home/Testimonials'
import { FAQ } from './home/FAQ'
import { CallToAction } from './home/CallToAction'
import { Phone, Mail, Instagram, Youtube, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/">
                <img
                  src="/logo.png"
                  alt="Docufieds Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>

            <nav className="hidden md:flex gap-8">
              <Link href="#services" className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary">Services</Link>
              <Link href="#how-it-works" className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary">How it Works</Link>
              <Link href="#pricing" className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary">Pricing</Link>
              <Link href="#contact" className="text-sm font-semibold leading-6 text-gray-900 hover:text-brand-primary">Contact</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="hidden sm:flex text-gray-700 hover:text-brand-primary hover:bg-brand-50">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="hidden sm:flex bg-brand-primary hover:bg-brand-secondary">Get Started</Button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white"
            >
              <div className="space-y-1 px-4 py-6 bg-white">
                <Link
                  href="#services"
                  className="block px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Services
                </Link>
                <Link
                  href="#how-it-works"
                  className="block px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How it Works
                </Link>
                <Link
                  href="#contact"
                  className="block px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="pt-4 flex flex-col gap-3">
                  <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-center bg-brand-primary hover:bg-brand-secondary">Get Started</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <HeroSection />
        <TrustIndicators />
        <div id="services">
          <ServicesOverview />
        </div>
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <VisaCategories />
        <WhyChoose />
        <Testimonials />
        <FAQ />
        <CallToAction />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16" id="contact">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <img
                src="/logo.png"
                alt="Docufieds Logo"
                className="h-10 w-auto object-contain brightness-0 invert mb-6"
              />
              <p className="text-gray-400 text-sm leading-6 mb-6">
                Your trusted partner for hassle-free visa processing and document verification services. We make travel documentation simple and secure.
              </p>
              <div className="flex gap-4">
                <Link href="https://instagram.com/docufieds" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="https://youtube.com/@docufieds" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                  <Youtube className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Services</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Visa Application</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Document Verification</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Embassy Appointments</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Translation Services</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Company</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact</h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-brand-primary flex-shrink-0" />
                  <span>01819-020202</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-brand-primary flex-shrink-0" />
                  <span>info@docufieds.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 text-brand-primary flex-shrink-0 font-bold">📍</div>
                  <span>832, 10th Floor, Sayed Plaza, Evercare Gate, Dhaka 1212, Dhaka, Bangladesh</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Docufieds. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
