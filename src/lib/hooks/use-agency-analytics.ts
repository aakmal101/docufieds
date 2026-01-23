import { useQuery } from '@tanstack/react-query'

interface AnalyticsFilters {
    period?: string
    startDate?: string
    endDate?: string
}

export function useAgencyAnalyticsOverview(filters?: AnalyticsFilters) {
    return useQuery({
        queryKey: ['agency-analytics-overview', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.period) params.set('period', filters.period)
            if (filters?.startDate) params.set('startDate', filters.startDate)
            if (filters?.endDate) params.set('endDate', filters.endDate)

            const response = await fetch(`/api/agency/analytics/overview?${params}`)
            if (!response.ok) throw new Error('Failed to fetch analytics')
            return response.json()
        },
    })
}

export function useAgencyApplicationsByCountry(period?: string) {
    return useQuery({
        queryKey: ['agency-applications-by-country', period],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (period) params.set('period', period)

            const response = await fetch(`/api/agency/analytics/applications-by-country?${params}`)
            if (!response.ok) throw new Error('Failed to fetch data')
            return response.json()
        },
    })
}

export function useAgencyMonthlyTrend(months: number = 6) {
    return useQuery({
        queryKey: ['agency-monthly-trend', months],
        queryFn: async () => {
            const response = await fetch(`/api/agency/analytics/monthly-trend?months=${months}`)
            if (!response.ok) throw new Error('Failed to fetch data')
            return response.json()
        },
    })
}

export function useAgencyStatusDistribution(period?: string) {
    return useQuery({
        queryKey: ['agency-status-distribution', period],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (period) params.set('period', period)

            const response = await fetch(`/api/agency/analytics/status-distribution?${params}`)
            if (!response.ok) throw new Error('Failed to fetch data')
            return response.json()
        },
    })
}
