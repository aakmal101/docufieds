'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SupportLeadLogin() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Use standard NextAuth signIn
        const result = await signIn('credentials', {
            identifier,
            password,
            redirect: false,
        })

        if (result?.error) {
            setError('Invalid credentials. Please try again.')
            setLoading(false)
        } else {
            // Success - Redirect manually to the Support Lead Dashboard
            toast.success('Login successful')
            router.push('/admin/support-lead')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/dashboard/support" className="inline-flex items-center text-purple-700 hover:text-purple-900 mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Portal
                    </Link>
                    <div className="flex justify-center mb-4">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                            <ShieldCheck className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Lead Access</h1>
                    <p className="text-gray-600">Administrative Login</p>
                </div>

                <Card className="border-t-4 border-t-purple-600 shadow-lg">
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>Enter your admin credentials</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Username / Email</Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    placeholder="e.g. Mathin"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    className="border-gray-300 focus:ring-purple-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="border-gray-300 focus:ring-purple-500"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    'Access Dashboard'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-6 text-sm text-gray-500">
                    Need help? Contact System Administrator.
                </p>
            </div>
        </div>
    )
}
