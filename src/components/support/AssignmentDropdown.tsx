'use client'

import { useState, useEffect } from 'react'
// Actually, standard shadcn is usually in '@/components/ui/dropdown-menu'
// Let's assume standard paths first.
import {
    DropdownMenu as Dropdown,
    DropdownMenuContent as Content,
    DropdownMenuItem as Item,
    DropdownMenuTrigger as Trigger,
    DropdownMenuLabel as Label,
    DropdownMenuSeparator as Separator
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import { UserPlus, ChevronDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AssignmentDropdownProps {
    applicationId: string
    currentMemberId?: string | null
    onAssign: () => void
    disabled?: boolean
}

interface TeamMember {
    id: string
    fullName: string
    _count: {
        assignedApplications: number
    }
}

export function AssignmentDropdown({ applicationId, currentMemberId, onAssign, disabled }: AssignmentDropdownProps) {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(false)
    const [assigning, setAssigning] = useState(false)

    // Debug logging for state changes
    useEffect(() => {
        console.log("Current members state:", members);
    }, [members]);

    const fetchMembers = async () => {
        if (members.length > 0) return
        setLoading(true)
        try {
            console.log('Fetching team members...')
            // Add timestamp to prevent browser caching
            const res = await fetch(`/api/admin/support-lead/team?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            })
            if (res.ok) {
                const data = await res.json()
                // Debug log
                console.log('API Response Data:', data)
                console.log('Is Array?', Array.isArray(data))
                console.log('Length:', data.length)

                if (Array.isArray(data)) {
                    setMembers(data)
                } else {
                    console.error('API returned non-array data:', data)
                }
            } else {
                console.error('Failed to fetch members:', res.status, res.statusText)
                toast.error(`Error loading team: ${res.statusText}`)
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to load team members')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async (memberId: string) => {
        setAssigning(true)
        try {
            const endpoint = currentMemberId
                ? '/api/admin/support-lead/applications/reassign'
                : '/api/admin/support-lead/applications/assign'

            const body = currentMemberId
                ? { applicationId, newMemberId: memberId }
                : { applicationId, memberId }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                toast.success(currentMemberId ? 'Reassigned successfully' : 'Assigned successfully')
                onAssign()
            } else {
                toast.error('Failed to assign')
            }
        } catch (error) {
            toast.error('Error assigning application')
        } finally {
            setAssigning(false)
        }
    }

    return (
        <Dropdown onOpenChange={(open) => {
            if (open) {
                console.log("Dropdown opened, triggering fetch...");
                fetchMembers();
            }
        }}>
            <Trigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={disabled || assigning}
                >
                    {assigning ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                        <UserPlus className="h-3 w-3 mr-2" />
                    )}

                    {currentMemberId ? 'Reassign' : 'Assign'}
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
            </Trigger>
            <Content align="end" className="w-56">
                <Label>Select Team Member</Label>
                <Separator />
                {loading ? (
                    <div className="p-2 flex justify-center text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">No active members</div>
                ) : (
                    members.map((member) => (
                        <Item
                            key={member.id}
                            onClick={() => handleAssign(member.id)}
                            disabled={member.id === currentMemberId}
                            className="flex justify-between items-center cursor-pointer"
                        >
                            <span>{member.fullName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${member._count.assignedApplications > 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {member._count.assignedApplications}
                            </span>
                        </Item>
                    ))
                )}
            </Content>
        </Dropdown>
    )
}
