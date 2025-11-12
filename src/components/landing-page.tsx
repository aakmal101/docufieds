'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle,
  ArrowRight,
  Star,
  Phone,
  Mail
} from 'lucide-react'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'individual' | 'agency'>('individual')

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Processing",
      description: "Your documents are processed with the highest security standards"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Fast Turnaround",
      description: "Quick processing times with real-time status updates"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Support",
      description: "Dedicated support team to guide you through the process"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Digital Delivery",
      description: "Receive your processed documents digitally or via courier"
    }
  ]

  const stats = [
    { label: "Applications Processed", value: "10,000+" },
    { label: "Success Rate", value: "98%" },
    { label: "Countries Supported", value: "50+" },
    { label: "Happy Customers", value: "8,500+" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-docufieds-50 to-docufieds-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Docufieds Logo" 
                className="h-16 w-36 object-contain"
              />
            </div>
            <div className="flex items-center space-x-4">
          <Link href="/auth/signin">
            <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-brand-primary hover:bg-brand-secondary">Get Started</Button>
          </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Visa Document Processing
              <span className="text-brand-primary"> Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your visa application process with our comprehensive document processing portal. 
              Whether you're an individual traveler or a travel agency, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-brand-primary hover:bg-brand-secondary">
                  Start Your Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Client Type Selection */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Service Type
            </h2>
            <p className="text-lg text-gray-600">
              Tailored solutions for different client needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Individual Client */}
            <Card className={`cursor-pointer transition-all duration-300 ${
                activeTab === 'individual' ? 'ring-2 ring-brand-primary shadow-lg' : 'hover:shadow-md'
            }`} onClick={() => setActiveTab('individual')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-brand-primary mr-3" />
                    <div>
                      <CardTitle>Individual Clients</CardTitle>
                      <CardDescription>Personal visa applications</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Prepaid</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Pay before service</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Live verification required</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Full self-service portal</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Guided workflow</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Travel Agency */}
            <Card className={`cursor-pointer transition-all duration-300 ${
              activeTab === 'agency' ? 'ring-2 ring-brand-accent shadow-lg' : 'hover:shadow-md'
            }`} onClick={() => setActiveTab('agency')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-8 w-8 text-brand-accent mr-3" />
                    <div>
                      <CardTitle>Travel Agencies</CardTitle>
                      <CardDescription>Bulk processing solutions</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Postpaid</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>15-day payment cycle</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Bulk processing capabilities</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>10 document limit before payment</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Dedicated agency dashboard</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Docufieds?
            </h2>
            <p className="text-lg text-gray-600">
              Experience the future of visa document processing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-docufieds-100 rounded-lg flex items-center justify-center text-brand-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-brand-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-docufieds-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Docufieds made my visa application process so much easier. The guided workflow 
                  and real-time updates kept me informed every step of the way."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold">Sarah Ahmed</div>
                    <div className="text-sm text-gray-500">Individual Client</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-primary to-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-docufieds-100 mb-8">
            Join thousands of satisfied customers who trust Docufieds for their visa processing needs.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary">
              Create Your Account Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/logo.png" 
                  alt="Docufieds Logo" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <p className="text-gray-400">
                Your trusted partner for visa document processing services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Individual Applications</li>
                <li>Agency Services</li>
                <li>Document Processing</li>
                <li>Status Tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQ</li>
                <li>Live Chat</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>support@docufieds.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Docufieds. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
