'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AutoAssignToggleProps {
    isEnabled: boolean
    onToggle: (val: boolean) => void
    onOpenConfig: () => void
}

export function AutoAssignToggle({ isEnabled, onToggle, onOpenConfig }: AutoAssignToggleProps) {
    return (
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
                <Switch
                    id="auto-assign"
                    checked={isEnabled}
                    onCheckedChange={onToggle}
                />
                <Label htmlFor="auto-assign" className="text-sm font-medium">
                    Auto-Assign {isEnabled ? 'On' : 'Off'}
                </Label>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <Button variant="ghost" size="icon" onClick={onOpenConfig} className="h-8 w-8 text-gray-500 hover:text-gray-900">
                <Settings className="h-4 w-4" />
            </Button>
        </div>
    )
}
