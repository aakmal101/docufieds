'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Users, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SupportPortalLanding() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            {/* Header */}
            <header className="p-6">
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                            Support Portal
                        </h1>
                        <p className="text-lg text-gray-600">
                            Welcome to the Docufieds Support Workspace. Please select your role to continue.
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                    {/* Support Lead Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 border-t-4 border-t-purple-600">
                            <CardHeader className="text-center">
                                <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4 w-20 h-20 flex items-center justify-center">
                                    <ShieldCheck className="h-10 w-10 text-purple-600" />
                                </div>
                                <CardTitle className="text-2xl">Support Lead</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    For Team Leads & Administrators
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-center">
                                <p className="text-gray-600">
                                    Manage team assignments, monitor workload, review escalations, and handle team operations.
                                </p>
                                <div className="pt-4">
                                    <Link href="/auth/support-lead/login">
                                        <Button className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-base group">
                                            Login as Lead
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <div className="mt-4 p-3 bg-purple-50 rounded text-sm text-purple-800 text-left border border-purple-100">
                                        <p className="font-semibold text-xs uppercase tracking-wider mb-1">Demo Credentials:</p>
                                        <p>Username: <span className="font-mono bg-white px-1 rounded">Shahoriar</span></p>
                                        <p>Password: <span className="font-mono bg-white px-1 rounded">lallallal</span></p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Support Member Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-600">
                            <CardHeader className="text-center">
                                <div className="mx-auto bg-blue-100 p-4 rounded-full mb-4 w-20 h-20 flex items-center justify-center">
                                    <Users className="h-10 w-10 text-blue-600" />
                                </div>
                                <CardTitle className="text-2xl">Support Member</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    For Support Agents
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-center">
                                <p className="text-gray-600">
                                    Process applications, verify documents, and assist customers with their visa requests.
                                </p>
                                <div className="pt-4">
                                    <Link href="/auth/support-member/login">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base group">
                                            Login as Member
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <p className="mt-4 text-sm text-gray-400">
                                        Credentials provided by your Lead
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Docufieds. Authorized Personnel Only.
            </footer>
        </div>
    )
}
