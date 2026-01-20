'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'INDIVIDUAL') {
      router.push('/dashboard')
      return
    }

    checkPasswordStatus()
  }, [session, status, router])

  const checkPasswordStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/password')
      const data = await response.json()

      if (data.success) {
        setHasPassword(data.data.hasPassword)
      }
    } catch (error) {
      console.error('Error checking password status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate passwords match
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match')
        setSaving(false)
        return
      }

      // Validate password length
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long')
        setSaving(false)
        return
      }

      // If updating password, require current password
      if (hasPassword && !formData.currentPassword) {
        toast.error('Please enter your current password')
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: formData.newPassword,
          currentPassword: hasPassword ? formData.currentPassword : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(hasPassword ? 'Password updated successfully!' : 'Password set successfully!')
        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        // Update password status
        setHasPassword(true)
      } else {
        toast.error(data.message || 'Failed to update password')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  // Render settings
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/individual')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">
          Manage your account security and password
        </p>
      </div>

      {/* Password Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Password Settings
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? 'Update your password to keep your account secure'
              : 'Set a password to enable password-based login for your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasPassword && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't set a password yet. Setting a password will allow you to login with your email/phone and password instead of OTP.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {hasPassword ? 'New Password' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={hasPassword ? 'Enter new password' : 'Enter password (min 6 characters)'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {hasPassword ? 'Confirm New Password' : 'Confirm Password'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/individual')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {hasPassword ? 'Updating...' : 'Setting...'}
                  </>
                ) : (
                  <>
                    {hasPassword ? 'Update Password' : 'Set Password'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Member ID</span>
            <span className="text-sm text-gray-900">{session?.user?.memberId || 'Not assigned'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Email</span>
            <span className="text-sm text-gray-900">{session?.user?.email || 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Phone</span>
            <span className="text-sm text-gray-900">{session?.user?.phone || 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Account Status</span>
            <span className="text-sm text-gray-900">{session?.user?.status || 'PENDING'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-500">Password Status</span>
            <span className="text-sm flex items-center">
              {hasPassword ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600">Set</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-yellow-600">Not Set</span>
                </>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
