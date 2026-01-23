import { useQuery } from '@tanstack/react-query'

export function useAgencyCreditStatus() {
    return useQuery({
        queryKey: ['agency-credit-status'],
        queryFn: async () => {
            const response = await fetch('/api/agency/credit/status')
            if (!response.ok) throw new Error('Failed to fetch credit status')
            return response.json()
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    })
}
