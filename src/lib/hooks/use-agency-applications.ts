import { useQuery } from '@tanstack/react-query'

interface ApplicationFilters {
    page?: number
    limit?: number
    status?: string
    country?: string
    search?: string
    processType?: string
}

export function useAgencyApplications(filters?: ApplicationFilters) {
    return useQuery({
        queryKey: ['agency-applications', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.page) params.set('page', filters.page.toString())
            if (filters?.limit) params.set('limit', filters.limit.toString())
            if (filters?.status) params.set('status', filters.status)
            if (filters?.country) params.set('country', filters.country)
            if (filters?.search) params.set('search', filters.search)
            if (filters?.processType) params.set('processType', filters.processType)

            const response = await fetch(`/api/agency/applications?${params}`)
            if (!response.ok) throw new Error('Failed to fetch applications')
            return response.json()
        },
    })
}

export function useAgencyApplicationStats() {
    return useQuery({
        queryKey: ['agency-application-stats'],
        queryFn: async () => {
            const response = await fetch('/api/agency/applications/stats')
            if (!response.ok) throw new Error('Failed to fetch stats')
            return response.json()
        },
    })
}
