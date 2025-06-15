import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { databaseApi } from '@/lib/api'

export function useDatabases() {
  return useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const response = await databaseApi.list()
      return response.data
    },
  })
}

export function useDatabase(name: string) {
  return useQuery({
    queryKey: ['database', name],
    queryFn: async () => {
      const response = await databaseApi.get(name)
      return response.data
    },
    enabled: !!name,
  })
}

export function useDatabaseStats(name: string) {
  return useQuery({
    queryKey: ['database-stats', name],
    queryFn: async () => {
      const response = await databaseApi.getStats(name)
      return response.data
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
      return response.data
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
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}