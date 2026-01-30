'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Save, User, Mail, Phone, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface SupportProfile {
    id: string
    fullName: string
    email: string
    phone: string | null
    photoUrl: string | null
}

export default function SupportProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<SupportProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/support-member/me')
            if (res.ok) {
                const data = await res.json()
                setProfile(data)
                setFormData(prev => ({
                    ...prev,
                    fullName: data.fullName || '',
                    phone: data.phone || ''
                }))
            }
        } catch (error) {
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/auth/support-member/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    phone: formData.phone,
                    ...(formData.password ? { password: formData.password } : {})
                })
            })

            if (!res.ok) throw new Error('Update failed')

            const updated = await res.json()
            setProfile(updated)
            setIsEditing(false)
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
            toast.success('Profile updated successfully')
            router.refresh()
        } catch (error) {
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Sidebar / Stats Card could go here, for now just full width or simple layout */}

                {/* Main Profile Card */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border-4 border-purple-50">
                                {profile.photoUrl ? (
                                    <AvatarImage src={profile.photoUrl} className="object-cover" />
                                ) : (
                                    <AvatarFallback className="text-2xl bg-purple-100 text-purple-700 font-bold">
                                        {profile.fullName?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                                <CardDescription>{profile.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="pl-9"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="pl-9"
                                                placeholder="+1..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t">
                                    <Label className="text-gray-900 font-medium">Change Password (Optional)</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    className="pl-9"
                                                    placeholder="Leave empty to keep current"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    className="pl-9"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                                        <p className="text-gray-900 font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {profile.fullName}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">Email Address</h3>
                                        <p className="text-gray-900 font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {profile.email}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                                        <p className="text-gray-900 font-medium flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {profile.phone || 'Not set'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
