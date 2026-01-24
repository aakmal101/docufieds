'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface PasswordGeneratorProps {
    onGenerate: (password: string) => void
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {

    const generate = () => {
        const length = 12
        // Removing ambiguous chars: 0, O, I, l, 1
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
        let password = ""
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n))
        }
        onGenerate(password)
        copyToClipboard(password)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Password copied to clipboard')
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={generate}
            className="flex items-center"
        >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Secure Password
        </Button>
    )
}
