import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databaseApi } from '@/lib/api'

export function useDatabases() {
  return useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const response = await databaseApi.list()
      // Handle SQLite API response format
      return response.data?.databases || response.data || []
    },
  })
}

export function useDatabase(name: string) {
  return useQuery({
    queryKey: ['database', name],
    queryFn: async () => {
      const response = await databaseApi.get(name)
      // Handle SQLite API response format
      return response.data?.database || response.data
    },
    enabled: !!name,
  })
}

export function useDatabaseStats(name: string) {
  return useQuery({
    queryKey: ['database-stats', name],
    queryFn: async () => {
      const response = await databaseApi.getStats(name)
      // Handle SQLite API response format
      return response.data?.stats || response.data
    },
    enabled: !!name,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useCreateDatabase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await databaseApi.create(data)
      // Handle SQLite API response format
      return response.data?.database || response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}

export function useDeleteDatabase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await databaseApi.delete(name)
      // Handle SQLite API response format  
      return response.data || response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}