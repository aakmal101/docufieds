'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Shield, Users, Lock, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupportLoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // State for Lead Login
    const [leadCreds, setLeadCreds] = useState({ identifier: '', password: '' })

    // State for Member Login
    const [memberCreds, setMemberCreds] = useState({ email: '', password: '' })

    const handleLeadLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                identifier: leadCreds.identifier,
                password: leadCreds.password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid Lead credentials')
                toast.error('Login failed')
            } else {
                toast.success('Welcome back, Lead!')
                window.location.href = '/admin/support-lead' // Full reload to ensure session
            }
        } catch (error) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleMemberLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/support-member/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberCreds)
            })

            const data = await res.json()

            if (res.ok && data.success) {
                toast.success(`Welcome, ${data.member.fullName}!`)
                window.location.href = '/admin/support-member' // Full reload
            } else {
                setError(data.message || 'Login failed')
                toast.error(data.message || 'Login failed')
            }
        } catch (error) {
            setError('Connection failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link href="/auth/signin" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Main Login
                    </Link>
                    <div className="mx-auto bg-white p-4 rounded-xl shadow-sm border w-fit mb-6">
                        <img src="/logo.png" alt="Doocufieds" className="h-10 w-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Support Portal Access</h1>
                    <p className="text-slate-500 mt-2">Secure gateway for support personnel</p>
                </div>

                <Card className="border-slate-200 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Tabs defaultValue="member" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                <TabsTrigger value="member">Team Member</TabsTrigger>
                                <TabsTrigger value="lead">Support Lead</TabsTrigger>
                            </TabsList>

                            {/* Member Login */}
                            <TabsContent value="member">
                                <form onSubmit={handleMemberLogin} className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 mb-6">
                                        <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold">Team Member Access</p>
                                            <p className="opacity-90">Log in to view assigned applications and process tasks.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="member-email">Work Email</Label>
                                        <Input
                                            id="member-email"
                                            type="email"
                                            placeholder="name@docufieds.support"
                                            value={memberCreds.email}
                                            onChange={e => setMemberCreds({ ...memberCreds, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="member-pass">Password</Label>
                                        <Input
                                            id="member-pass"
                                            type="password"
                                            value={memberCreds.password}
                                            onChange={e => setMemberCreds({ ...memberCreds, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                        Login as Member
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Lead Login */}
                            <TabsContent value="lead">
                                <form onSubmit={handleLeadLogin} className="space-y-4">
                                    <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 mb-6">
                                        <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div className="text-sm text-red-800">
                                            <p className="font-semibold">Administrative Access</p>
                                            <p className="opacity-90">Reserved for Support Leads and Agency Admins.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-id">Username / Email</Label>
                                        <Input
                                            id="lead-id"
                                            placeholder="e.g. Shahoriar"
                                            value={leadCreds.identifier}
                                            onChange={e => setLeadCreds({ ...leadCreds, identifier: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-pass">Password</Label>
                                        <Input
                                            id="lead-pass"
                                            type="password"
                                            value={leadCreds.password}
                                            onChange={e => setLeadCreds({ ...leadCreds, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                        Login as Lead
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t py-4 bg-slate-50 rounded-b-lg">
                        <p className="text-xs text-slate-500">Restricted System • Authorized Personnel Only</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
