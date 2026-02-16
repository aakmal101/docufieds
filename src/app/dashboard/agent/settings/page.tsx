'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AgentSettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [hasPassword, setHasPassword] = useState(false)
    const [showPasswords, setShowPasswords] = useState(false)

    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
    })

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
            return
        }
        if (status === 'authenticated' && session?.user?.role !== 'AGENT') {
            router.push('/dashboard')
            return
        }
        if (status === 'authenticated') {
            fetchProfile()
            fetchPasswordStatus()
        }
    }, [session, status])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile')
            const data = await res.json()
            if (data.success && data.data) {
                setProfile({
                    fullName: data.data.fullName || '',
                    email: data.data.email || '',
                    phone: data.data.phone || '',
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPasswordStatus = async () => {
        try {
            const res = await fetch('/api/user/password')
            const data = await res.json()
            if (data.success) {
                setHasPassword(data.data.hasPassword)
            }
        } catch (error) {
            console.error('Error checking password:', error)
        }
    }

    const handleSaveProfile = async () => {
        if (!profile.fullName.trim()) {
            toast.error('Name is required')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: profile.fullName.trim(),
                    email: profile.email.trim(),
                    phone: profile.phone.trim(),
                }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Profile updated successfully')
            } else {
                toast.error(data.message || 'Failed to update profile')
            }
        } catch (error) {
            toast.error('Error updating profile')
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwords.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (hasPassword && !passwords.currentPassword) {
            toast.error('Current password is required')
            return
        }

        setSavingPassword(true)
        try {
            const res = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: passwords.newPassword,
                    ...(hasPassword && { currentPassword: passwords.currentPassword }),
                }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message || 'Password updated')
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setHasPassword(true)
            } else {
                toast.error(data.message || 'Failed to update password')
            }
        } catch (error) {
            toast.error('Error updating password')
        } finally {
            setSavingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account information and security</p>
            </div>

            {/* Profile Information */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={profile.fullName}
                            onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                        />
                    </div>

                    <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" />
                        {hasPassword ? 'Change Password' : 'Set Password'}
                    </CardTitle>
                    <CardDescription>
                        {hasPassword
                            ? 'Update your existing password'
                            : 'Set a password for your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {hasPassword && (
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Enter current password"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPasswords ? 'text' : 'password'}
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="Enter new password (min 6 characters)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type={showPasswords ? 'text' : 'password'}
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                        >
                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showPasswords ? 'Hide' : 'Show'} passwords
                        </button>
                    </div>

                    <Button onClick={handleChangePassword} disabled={savingPassword}>
                        {savingPassword ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                        ) : (
                            <><Lock className="mr-2 h-4 w-4" /> {hasPassword ? 'Update Password' : 'Set Password'}</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
