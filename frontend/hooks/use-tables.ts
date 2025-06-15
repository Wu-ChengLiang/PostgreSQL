import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tableApi } from '@/lib/api'

export function useTables(database: string) {
  return useQuery({
    queryKey: ['tables', database],
    queryFn: async () => {
      const response = await tableApi.list(database)
      // Handle SQLite API response format
      return response.data?.tables || response.data || []
    },
    enabled: !!database,
  })
}

export function useTable(database: string, table: string) {
  return useQuery({
    queryKey: ['table', database, table],
    queryFn: async () => {
      const response = await tableApi.get(database, table)
      // Handle SQLite API response format
      return response.data?.table || response.data
    },
    enabled: !!database && !!table,
  })
}

export function useCreateTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ database, data }: { database: string; data: any }) => {
      const response = await tableApi.create(database, data)
      // Handle SQLite API response format
      return response.data?.table || response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.database] })
    },
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ database, table }: { database: string; table: string }) => {
      const response = await tableApi.delete(database, table)
      // Handle SQLite API response format
      return response.data || response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.database] })
    },
  })
}