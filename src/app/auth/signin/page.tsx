'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Globe,
  ArrowLeft,
  Loader2,
  User,
  Building2,
  Shield,
  Users,
  FileText,
  CreditCard,
  Phone,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loginMode, setLoginMode] = useState<'password' | 'demo'>('password')
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: '',
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.identifier,
        password: credentials.password,
      })

      if (authError) {
        console.error('Sign in error:', authError.message)
        setError(authError.message || 'Login failed. Please check your credentials.')
        toast.error(authError.message || 'Login failed.')
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Authentication failed. Please try again.')
        toast.error('Authentication failed. Please try again.')
        setLoading(false)
        return
      }

      toast.success('Signed in successfully!')

      // Invalidate the Next.js server component cache so middleware
      // sees the fresh Supabase cookies, then navigate.
      router.refresh()
      router.push(next)
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error?.message || 'Something went wrong. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleLogin = async (role: string) => {
    setLoading(true)
    setLoadingRole(role)
    setError('')

    try {
      const supabase = createClient()

      // Demo login — use the role-specific demo email
      const identifier = `${role.toLowerCase()}@demo.com`

      console.log(`[Demo Login] Attempting: ${identifier}`)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: 'demo123456',
      })

      if (authError) {
        console.error('Demo sign in error:', authError.message, authError)
        setError(authError.message || 'Demo login failed. Please try again.')
        toast.error(authError.message || 'Demo login failed.')
        setLoading(false)
        setLoadingRole(null)
        return
      }

      if (!data.user) {
        console.error('Demo login: no user returned despite no error')
        setError('Demo session not created. Please try again.')
        toast.error('Demo session not created.')
        setLoading(false)
        setLoadingRole(null)
        return
      }

      console.log(`[Demo Login] Success: ${data.user.email} (${data.user.id})`)
      toast.success(`Signed in as ${role}!`)

      // Invalidate the Next.js server component cache so middleware
      // and the /dashboard server component see the fresh session cookies.
      router.refresh()
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Demo login unexpected error:', error)
      const errorMessage = error?.message || 'Something went wrong. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      setLoadingRole(null)
    }
  }

  const roleButtons = [
    {
      role: 'INDIVIDUAL',
      title: 'Individual User',
      description: 'Personal visa applications',
      icon: <User className="h-6 w-6" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      role: 'AGENCY',
      title: 'Travel Agency',
      description: 'Bulk processing solutions',
      icon: <Building2 className="h-6 w-6" />,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      role: 'ADMIN',
      title: 'System Administrator',
      description: 'Full system access',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      role: 'AGENT',
      title: 'Independent Agent',
      description: 'Agent portal access',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-teal-600 hover:bg-teal-700',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },

    {
      role: 'LEGAL',
      title: 'Legal Team',
      description: 'Legal document processing',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      role: 'ACCOUNTS',
      title: 'Accounts Team',
      description: 'Payment & financial management',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="Docufieds Logo"
              className="h-20 w-36 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Choose your role to sign in</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Login with your credentials or use demo mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Mode Toggle */}
            <div className="flex space-x-2 mb-6 border-b">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${loginMode === 'password'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('demo')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${loginMode === 'demo'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Demo Mode
              </button>
            </div>

            {/* Password Login Form */}
            {loginMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="mb-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                    Email or Phone Number
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="Enter your email or phone"
                    value={credentials.identifier}
                    onChange={(e) => setCredentials(prev => ({ ...prev, identifier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Don't have a password? Complete your profile and set one in Settings.
                </p>
              </form>
            )}

            {/* Demo Mode Role Selection */}
            {loginMode === 'demo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleButtons.map((button) => (
                  <Button
                    key={button.role}
                    variant="outline"
                    className={`h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all border-2 ${button.bgColor
                      } ${button.borderColor}`}
                    onClick={() => handleRoleLogin(button.role)}
                    disabled={loading}
                  >
                    <div className={`${button.textColor}`}>
                      {loadingRole === button.role ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        button.icon
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">{button.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{button.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <Card className="mt-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>
                <strong>Demo Mode:</strong> Click any role button above to sign in instantly.
              </span>
            </div>

            <div className="pt-4 border-t flex justify-center">
              <Link href="/auth/support-login" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center transition-colors">
                <Shield className="h-4 w-4 mr-2" />
                Access Support Team Portal
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
