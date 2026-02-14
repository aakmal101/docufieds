'use client'

import { BadgeCheck } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface VerifiedBadgeProps {
    status?: string // 'APPROVED' | 'PENDING_REVIEW' | 'DECLINED'
    showTooltip?: boolean
    className?: string
}

export function VerifiedBadge({ status, showTooltip = true, className }: VerifiedBadgeProps) {
    if (status !== 'APPROVED') return null

    const icon = <BadgeCheck className={`h-5 w-5 text-blue-500 fill-blue-50 ${className || ''}`} />

    if (!showTooltip) return icon

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {icon}
                </TooltipTrigger>
                <TooltipContent>
                    <p>Verified Profile</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
