'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PasswordGenerator } from '@/components/support/PasswordGenerator'
import { Loader2, ArrowLeft, MoreHorizontal, UserX, UserCheck, Edit } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function OnboardMemberPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<any[]>([])
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        sendEmail: true,
        requireChange: true
    })

    // Fetch team list for table
    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/admin/support-lead/team')
            if (res.ok) setMembers(await res.json())
        } catch (e) { console.error('Failed to load team') }
    }

    useEffect(() => { fetchTeam() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/admin/support-lead/team/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`Member ${data.member.fullName} created successfully`)
                // Reset form
                setFormData({
                    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
                    sendEmail: true, requireChange: true
                })
                fetchTeam() // Refresh table
            } else {
                toast.error(data.details || data.error || 'Failed to create member')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/support-lead/team/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            })
            if (res.ok) {
                toast.success(currentStatus ? 'Member disabled' : 'Member enabled')
                fetchTeam()
            }
        } catch (error) {
            toast.error('Action failed')
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link href="/admin/support-lead/team" className="inline-flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Team Workload
            </Link>

            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-500">Onboard new members and manage existing accounts.</p>
            </div>

            {/* Onboarding Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Onboard New Member</CardTitle>
                    <CardDescription>Create a new account for your support team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Account Security</h3>
                            <div className="space-y-4">
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="password">Initial Password *</Label>
                                        <Input
                                            id="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <PasswordGenerator onGenerate={(pw) => setFormData({ ...formData, password: pw, confirmPassword: pw })} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sendEmail"
                                    checked={formData.sendEmail}
                                    onCheckedChange={(c) => setFormData({ ...formData, sendEmail: c as boolean })}
                                />
                                <Label htmlFor="sendEmail">Send login credentials via email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="requireChange"
                                    checked={formData.requireChange}
                                    onCheckedChange={(c) => setFormData({ ...formData, requireChange: c as boolean })}
                                />
                                <Label htmlFor="requireChange">Require password change on first login</Label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                Create Team Member
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Team Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Team Members</CardTitle>
                    <CardDescription>Manage existing team access.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Active Assignments</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id} className={!member.isActive ? 'opacity-60 bg-gray-50' : ''}>
                                    <TableCell className="font-medium">{member.fullName}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {member._count?.assignedApplications || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.isActive ? 'outline' : 'destructive'}>
                                            {member.isActive ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleStatus(member.id, member.isActive)}>
                                                    {member.isActive ? (
                                                        <><UserX className="mr-2 h-4 w-4" /> Disable Account</>
                                                    ) : (
                                                        <><UserCheck className="mr-2 h-4 w-4" /> Enable Account</>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
