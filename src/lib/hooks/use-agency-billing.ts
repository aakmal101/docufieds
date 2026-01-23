import { useQuery } from '@tanstack/react-query'

interface BillingFilters {
    startDate?: string
    endDate?: string
    status?: string
    page?: number
    limit?: number
}

export function useAgencyBilling(filters?: BillingFilters) {
    return useQuery({
        queryKey: ['agency-billing', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.startDate) params.set('startDate', filters.startDate)
            if (filters?.endDate) params.set('endDate', filters.endDate)
            if (filters?.status) params.set('status', filters.status)
            if (filters?.page) params.set('page', filters.page.toString())
            if (filters?.limit) params.set('limit', filters.limit.toString())

            const response = await fetch(`/api/agency/billing?${params}`)
            if (!response.ok) throw new Error('Failed to fetch billing')
            return response.json()
        },
    })
}

export function useAgencyBillingSummary() {
    return useQuery({
        queryKey: ['agency-billing-summary'],
        queryFn: async () => {
            const response = await fetch('/api/agency/billing/summary')
            if (!response.ok) throw new Error('Failed to fetch summary')
            return response.json()
        },
    })
}
