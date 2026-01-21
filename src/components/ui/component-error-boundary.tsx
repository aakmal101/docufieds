'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
    children: React.ReactNode
    name?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ComponentErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Error in ${this.props.name || 'Component'}:`, error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="min-w-0">
                        <h3 className="text-sm font-medium text-red-900">
                            {this.props.name || 'Component'} Error
                        </h3>
                        <p className="text-xs text-red-600 truncate">
                            {this.state.error?.message}
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
