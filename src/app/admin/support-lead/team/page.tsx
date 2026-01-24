'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserX, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function TeamWorkloadPage() {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedMember, setExpandedMember] = useState<string | null>(null)

    const fetchTeam = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/support-lead/team/workload')
            if (res.ok) setMembers(await res.json())
        } catch (error) {
            toast.error('Failed to load team data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTeam()
    }, [])

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team Workload</h1>
                    <p className="text-gray-500">Monitor team performance and manage assignments.</p>
                </div>
                <Link href="/admin/support-lead/onboard">
                    <Button>+ Onboard New Member</Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="space-y-4">
                    {members.map((member) => (
                        <Card key={member.id} className={!member.isActive ? 'opacity-75 bg-gray-50' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={member.photoUrl} />
                                            <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center">
                                                {member.fullName}
                                                {!member.isActive && <Badge variant="destructive" className="ml-2 text-xs">Disabled</Badge>}
                                            </h3>
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold">{member.activeCount}</p>
                                            <p className="text-xs text-gray-500 uppercase">Active</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">{member.completedToday._count?.assignedApplications || 0}</p>
                                            <p className="text-xs text-gray-500 uppercase">Done Today</p>
                                        </div>
                                        <div className="text-center hidden md:block">
                                            <p className="text-xl font-medium text-gray-700">{member.avgProcessingTime}</p>
                                            <p className="text-xs text-gray-500 uppercase">Avg Time</p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                                        >
                                            {expandedMember === member.id ? <ChevronUp /> : <ChevronDown />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded View */}
                                {expandedMember === member.id && (
                                    <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium text-sm text-gray-500">Active Assignments</h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => toggleStatus(member.id, member.isActive)}
                                            >
                                                {member.isActive ? (
                                                    <><UserX className="h-4 w-4 mr-2" /> Disable Account</>
                                                ) : (
                                                    <><UserCheck className="h-4 w-4 mr-2" /> Enable Account</>
                                                )}
                                            </Button>
                                        </div>

                                        {member.currentAssignments.length > 0 ? (
                                            <div className="grid gap-2">
                                                {member.currentAssignments.map((app: any) => (
                                                    <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                                        <span className="font-mono text-sm">{app.id}</span>
                                                        <span className="text-sm">{app.country}</span>
                                                        <Badge variant="outline">{app.status}</Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(app.assignedAt).toLocaleDateString()}
                                                        </span>
                                                        <Button size="sm" variant="link" className="h-auto p-0">View</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No active assignments</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
