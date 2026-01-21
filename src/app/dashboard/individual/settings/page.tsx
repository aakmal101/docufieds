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
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Password state
  const [hasPassword, setHasPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Account Info state
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [accountData, setAccountData] = useState({
    fullName: '',
    email: '',
    phone: '',
    memberId: '',
    status: '',
    userId: ''
  })
  const [originalAccountData, setOriginalAccountData] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'INDIVIDUAL') {
      router.push('/dashboard')
      return
    }

    checkPasswordStatus()
    fetchUserData()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (data.success) {
        setAccountData({
          fullName: data.data.fullName || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          memberId: data.data.memberId || '',
          status: data.data.status || '',
          userId: data.data.userId || ''
        })
        setOriginalAccountData(data.data)
      } else {
        // Fallback to session data
        if (session?.user) {
          setAccountData({
            fullName: session.user.fullName || '',
            email: session.user.email || '',
            phone: session.user.phone || '',
            memberId: session.user.memberId || '',
            status: session.user.status || '',
            userId: session.user.userId || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

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

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAccountChange = (field: string, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }))
  }

  const toggleAccountEdit = () => {
    if (isEditingAccount) {
      // Cancelled editing, revert to original
      if (originalAccountData) {
        setAccountData({
          fullName: originalAccountData.fullName || '',
          email: originalAccountData.email || '',
          phone: originalAccountData.phone || '',
          memberId: originalAccountData.memberId || '',
          status: originalAccountData.status || '',
          userId: originalAccountData.userId || ''
        })
      }
    }
    setIsEditingAccount(!isEditingAccount)
  }

  const handleAccountSave = async () => {
    setSaving(true)
    try {
      // Validate email
      if (accountData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(accountData.email)) {
          toast.error('Invalid email format')
          setSaving(false)
          return
        }
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: accountData.fullName,
          email: accountData.email,
          phone: accountData.phone
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Account information updated!')
        setIsEditingAccount(false)
        setOriginalAccountData({ ...originalAccountData, ...accountData })

        // Update session
        update({
          ...session,
          user: {
            ...session?.user,
            fullName: accountData.fullName,
            email: accountData.email,
            phone: accountData.phone
          }
        })
      } else {
        toast.error(data.message || 'Failed to update account info')
      }
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate passwords match
      // Validate passwords match
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New passwords do not match')
        setSaving(false)
        return
      }

      // Validate password length
      // Validate password length
      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long')
        setSaving(false)
        return
      }

      // If updating password, require current password
      // If updating password, require current password
      if (hasPassword && !passwordForm.currentPassword) {
        toast.error('Please enter your current password')
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordForm.newPassword,
          currentPassword: hasPassword ? passwordForm.currentPassword : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(hasPassword ? 'Password updated successfully!' : 'Password set successfully!')
        // Clear form
        // Clear form
        setPasswordForm({
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

  if (status === 'loading' || loading) {
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
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
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
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
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
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </div>
          {!isEditingAccount ? (
            <Button variant="outline" size="sm" onClick={toggleAccountEdit}>
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={toggleAccountEdit} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAccountSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Full Name</span>
            {isEditingAccount ? (
              <Input
                value={accountData.fullName}
                onChange={(e) => handleAccountChange('fullName', e.target.value)}
                className="h-8 w-64"
              />
            ) : (
              <span className="text-sm text-gray-900">{accountData.fullName || 'Not set'}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Member ID</span>
            <span className="text-sm text-gray-900">{accountData.memberId || 'Not assigned'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Email</span>
            {isEditingAccount ? (
              <Input
                value={accountData.email}
                onChange={(e) => handleAccountChange('email', e.target.value)}
                className="h-8 w-64"
              />
            ) : (
              <span className="text-sm text-gray-900">{accountData.email || 'Not set'}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Phone</span>
            {isEditingAccount ? (
              <Input
                value={accountData.phone}
                onChange={(e) => handleAccountChange('phone', e.target.value)}
                className="h-8 w-64"
              />
            ) : (
              <span className="text-sm text-gray-900">{accountData.phone || 'Not set'}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium text-gray-500">Account Status</span>
            <span className="text-sm text-gray-900">{accountData.status || 'PENDING'}</span>
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
