'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnimatedConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive' | 'success'
    isLoading?: boolean
}

export function AnimatedConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false
}: AnimatedConfirmDialogProps) {
    // Prevent scrolling when open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-gray-600 mb-8 leading-relaxed">
                                {description}
                            </p>

                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="hover:scale-105 transition-transform"
                                >
                                    {cancelText}
                                </Button>
                                <Button
                                    variant={variant === 'success' ? 'default' : variant}
                                    className={`${variant === 'success' ? 'bg-green-600 hover:bg-green-700' : ''
                                        } hover:scale-105 transition-transform`}
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : confirmText}
                                </Button>
                            </div>
                        </div>

                        {/* Top Accent Line */}
                        <div className={`h-1.5 w-full absolute top-0 left-0 ${variant === 'destructive' ? 'bg-red-500' :
                                variant === 'success' ? 'bg-green-500' : 'bg-blue-600'
                            }`} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
