'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect } from 'react'

interface AutoAssignConfigModalProps {
    isOpen: boolean
    onClose: () => void
    config: any
    onSave: (config: any) => Promise<void>
}

export function AutoAssignConfigModal({ isOpen, onClose, config: initialConfig, onSave }: AutoAssignConfigModalProps) {
    const [config, setConfig] = useState(initialConfig || {
        isEnabled: true,
        assignmentMode: 'ROUND_ROBIN',
        maxActivePerMember: 10
    })

    useEffect(() => {
        if (initialConfig) setConfig(initialConfig)
    }, [initialConfig])

    const handleSave = async () => {
        await onSave(config)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Auto-Assignment Settings</DialogTitle>
                    <DialogDescription>Configure how tasks are distributed to your team.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Auto-Assignment</Label>
                            <p className="text-sm text-gray-500">Automatically assign new applications to members</p>
                        </div>
                        <Switch
                            checked={config.isEnabled}
                            onCheckedChange={(c) => setConfig({ ...config, isEnabled: c })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Assignment Strategy</Label>
                        <Select
                            value={config.assignmentMode}
                            onValueChange={(v) => setConfig({ ...config, assignmentMode: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROUND_ROBIN">Round Robin (Rotate)</SelectItem>
                                <SelectItem value="LEAST_LOADED">Least Loaded (Load Balancer)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            {config.assignmentMode === 'ROUND_ROBIN'
                                ? 'Assigns to the member who has been waiting longest.'
                                : 'Assigns to the member with the fewest active tasks.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Max Active Tasks Per Member</Label>
                        <Input
                            type="number"
                            value={config.maxActivePerMember}
                            onChange={(e) => setConfig({ ...config, maxActivePerMember: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500">Members above this limit will be skipped</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
