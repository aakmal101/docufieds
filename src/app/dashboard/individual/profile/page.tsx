'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  User,
  MapPin,
  FileText,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    birthCertificateNumber: '',
    nidNumber: '',
    passportNumber: '',
    presentAddress: '',
    permanentAddress: '',
    photoUrl: ''
  })
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

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

    fetchUserData()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (data.success) {
        setUser(data.data)
        setFormData({
          fullName: data.data.fullName || '',
          email: data.data.email || '',
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth).toISOString().split('T')[0] : '',
          placeOfBirth: data.data.placeOfBirth || '',
          birthCertificateNumber: data.data.birthCertificateNumber || '',
          nidNumber: data.data.nidNumber || '',
          passportNumber: data.data.passportNumber || '',
          presentAddress: data.data.presentAddress || '',
          permanentAddress: data.data.permanentAddress || '',
          photoUrl: data.data.photoUrl || ''
        })

        // Set photo preview if user has existing photo
        if (data.data.photoUrl) {
          setPhotoPreview(data.data.photoUrl)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setProfilePhoto(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // If there's a photo to upload, upload it first
      let photoUrl = formData.photoUrl
      if (profilePhoto) {
        const formDataPhoto = new FormData()
        formDataPhoto.append('file', profilePhoto)

        const uploadResponse = await fetch('/api/user/profile/photo', {
          method: 'POST',
          body: formDataPhoto,
        })

        const uploadData = await uploadResponse.json()
        if (uploadData.success && uploadData.data?.photoUrl) {
          photoUrl = uploadData.data.photoUrl
          // Update preview with new URL
          setPhotoPreview(photoUrl)
          // Update form data
          setFormData(prev => ({ ...prev, photoUrl }))
        } else {
          toast.error(uploadData.message || 'Failed to upload profile photo')
          setSaving(false)
          return
        }
      }

      // Update profile with all data including photo URL
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photoUrl }),
      })

      const data = await response.json()

      if (data.success) {
        // If user was just registered, show success message
        if (data.autoLogin) {
          toast.success('Profile saved! You are now registered and logged in. Set a password in Settings to login later.')
        } else {
          toast.success('Profile updated successfully!')
        }

        // Update local state with new data
        if (data.data) {
          setUser(data.data)
          setFormData(prev => ({
            ...prev,
            photoUrl: data.data.photoUrl || prev.photoUrl
          }))
          if (data.data.photoUrl) {
            setPhotoPreview(data.data.photoUrl)
          }
        }
        // Refresh user data to get updated profile
        await fetchUserData()
        // Small delay to show success message
        setTimeout(() => {
          router.push('/dashboard/individual')
        }, 1000)
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const calculateCompletion = () => {
    const requiredFields = [
      'fullName', 'dateOfBirth', 'placeOfBirth', 'birthCertificateNumber',
      'nidNumber', 'passportNumber', 'presentAddress', 'permanentAddress'
    ]

    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData]
      return value && value.trim() !== ''
    }).length

    return Math.round((completedFields / requiredFields.length) * 100)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  // Render profile
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-600">
          Complete your profile information to speed up your visa application process
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Profile Completion</h3>
            <span className="text-2xl font-bold text-red-600">{calculateCompletion()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateCompletion()}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {calculateCompletion() < 100
              ? `Complete ${8 - Math.floor((calculateCompletion() / 100) * 8)} more fields to finish your profile`
              : 'Your profile is complete!'
            }
          </p>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              {isEditing
                ? 'Provide accurate information as it will be used for your visa applications'
                : 'Your personal and contact information'}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            // VIEW MODE
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
                    <p className="text-gray-900 font-medium">{user?.fullName || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email Address</h4>
                    <p className="text-gray-900">{user?.email || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h4>
                    <p className="text-gray-900">
                      {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Place of Birth</h4>
                    <p className="text-gray-900">{user?.placeOfBirth || 'Not set'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Profile Photo</h4>
                  {user?.photoUrl ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={user.photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Document Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Birth Certificate Number</h4>
                    <p className="text-gray-900 font-mono">{user?.birthCertificateNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">National ID Number</h4>
                    <p className="text-gray-900 font-mono">{user?.nidNumber || 'Not set'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Passport Number</h4>
                    <p className="text-gray-900 font-mono">{user?.passportNumber || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Present Address</h4>
                    <p className="text-gray-900">{user?.presentAddress || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Permanent Address</h4>
                    <p className="text-gray-900">{user?.permanentAddress || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // EDIT MODE
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Update your email address for account notifications
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Place of Birth *</Label>
                  <Select value={formData.placeOfBirth} onValueChange={(value) => handleInputChange('placeOfBirth', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select place of birth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dhaka">Dhaka</SelectItem>
                      <SelectItem value="Chittagong">Chittagong</SelectItem>
                      <SelectItem value="Sylhet">Sylhet</SelectItem>
                      <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                      <SelectItem value="Khulna">Khulna</SelectItem>
                      <SelectItem value="Barisal">Barisal</SelectItem>
                      <SelectItem value="Rangpur">Rangpur</SelectItem>
                      <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhoto">Profile Photo</Label>
                  <div className="space-y-4">
                    {/* Photo Preview */}
                    {(photoPreview || user?.photoUrl) && (
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                          <img
                            src={photoPreview || user?.photoUrl}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          {profilePhoto ? 'New photo selected' : 'Current photo'}
                        </div>
                      </div>
                    )}

                    {/* File Upload */}
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id="profilePhoto"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePhoto"
                        className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {profilePhoto && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhoto(null)
                            setPhotoPreview(null)
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Document Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="birthCertificateNumber">Birth Certificate Number *</Label>
                    <Input
                      id="birthCertificateNumber"
                      type="text"
                      placeholder="Enter birth certificate number"
                      value={formData.birthCertificateNumber}
                      onChange={(e) => handleInputChange('birthCertificateNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nidNumber">National ID Number *</Label>
                    <Input
                      id="nidNumber"
                      type="text"
                      placeholder="Enter NID number"
                      value={formData.nidNumber}
                      onChange={(e) => handleInputChange('nidNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="passportNumber">Passport Number *</Label>
                    <Input
                      id="passportNumber"
                      type="text"
                      placeholder="Enter passport number"
                      value={formData.passportNumber}
                      onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Address Information</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="presentAddress">Present Address *</Label>
                    <Input
                      id="presentAddress"
                      type="text"
                      placeholder="Enter your present address"
                      value={formData.presentAddress}
                      onChange={(e) => handleInputChange('presentAddress', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permanentAddress">Permanent Address *</Label>
                    <Input
                      id="permanentAddress"
                      type="text"
                      placeholder="Enter your permanent address"
                      value={formData.permanentAddress}
                      onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    // Reset form to user data if needed? 
                    // For now, keeping form data as is allows resuming edits if they misclicked cancel.
                    // But standard is usually to reset. 
                    // Let's reset to ensure clean state next edit.
                    if (user) {
                      setFormData({
                        fullName: user.fullName || '',
                        email: user.email || '',
                        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                        placeOfBirth: user.placeOfBirth || '',
                        birthCertificateNumber: user.birthCertificateNumber || '',
                        nidNumber: user.nidNumber || '',
                        passportNumber: user.passportNumber || '',
                        presentAddress: user.presentAddress || '',
                        permanentAddress: user.permanentAddress || '',
                        photoUrl: user.photoUrl || ''
                      })
                      setProfilePhoto(null)
                      if (user.photoUrl) setPhotoPreview(user.photoUrl)
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
