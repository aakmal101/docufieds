'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  Phone
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRoleLogin = async (role: string) => {
    setLoading(true)
    setError('')

    try {
      // Create a mock identifier based on role
      const identifier = `${role.toLowerCase()}@demo.com`
      
      const result = await signIn('credentials', {
        identifier,
        otp: '123456', // Dummy OTP since verification is disabled
        redirect: false,
      })

      if (result?.error) {
        console.error('Sign in error:', result.error)
        setError(result.error || 'Login failed. Please try again.')
        toast.error('Login failed. Please try again.')
      } else {
        // Wait a moment for session to be created
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Get the updated session
        const session = await getSession()
        
        if (!session?.user) {
          setError('Session not created. Please try again.')
          toast.error('Session not created. Please try again.')
          setLoading(false)
          return
        }

        toast.success(`Signed in as ${role}!`)
        
        // Redirect based on user role
        const redirectPath = (() => {
          switch (session.user.role) {
            case 'INDIVIDUAL':
              return '/dashboard/individual'
            case 'AGENCY':
              return '/dashboard/agency'
            case 'ADMIN':
              return '/admin'
            case 'SUPPORT':
              return '/admin/support'
            case 'LEGAL':
              return '/admin/legal'
            case 'ACCOUNTS':
              return '/admin/accounts'
            case 'CASH_OFFICER':
              return '/admin/cash'
            default:
              return '/dashboard'
          }
        })()
        
        // Use window.location for a full page reload to ensure session is loaded
        window.location.href = redirectPath
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error?.message || 'Something went wrong. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
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
      role: 'SUPPORT',
      title: 'Support Team',
      description: 'Customer support & document management',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
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
            <CardTitle>Sign In as</CardTitle>
            <CardDescription>
              Select your role to access the appropriate dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleButtons.map((button) => (
                <Button
                  key={button.role}
                  variant="outline"
                  className={`h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all border-2 ${
                    button.bgColor
                  } ${button.borderColor}`}
                  onClick={() => handleRoleLogin(button.role)}
                  disabled={loading}
                >
                  <div className={`${button.textColor}`}>
                    {button.icon}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">{button.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{button.description}</p>
                  </div>
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              ))}
            </div>

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
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>
                <strong>Demo Mode:</strong> Click any role button above to sign in instantly. 
                No credentials required for testing.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
