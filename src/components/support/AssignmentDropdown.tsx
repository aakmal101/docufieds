'use client'

import { useState, useEffect } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/button-dropdown' // Adjust if you have a standard shadcn dropdown
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

    const fetchMembers = async () => {
        if (members.length > 0) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/support-lead/team')
            if (res.ok) {
                setMembers(await res.json())
            } else {
                console.error('Failed to fetch members:', res.status, res.statusText)
                toast.error(`Error loading team: ${res.statusText}`)
            }
        } catch (error) {
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
        <Dropdown>
            <Trigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={fetchMembers}
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
