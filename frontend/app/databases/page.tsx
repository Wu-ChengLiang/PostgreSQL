'use client'

import { useState } from 'react'
import { Plus, Database, Trash2, RefreshCw } from 'lucide-react'
import { useDatabases, useCreateDatabase, useDeleteDatabase } from '@/hooks/use-databases'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes } from '@/lib/utils'
import { Navbar } from '@/components/layout/navbar'

export default function DatabasesPage() {
  const { data: databases, isLoading, refetch } = useDatabases()
  const createDatabase = useCreateDatabase()
  const deleteDatabase = useDeleteDatabase()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newDbName, setNewDbName] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newDbName.trim()) {
      await createDatabase.mutateAsync({ name: newDbName })
      setNewDbName('')
      setShowCreateForm(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Databases</h1>
            <p className="text-gray-600 mt-1">Manage your PostgreSQL databases</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Database
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Database</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="flex gap-4">
                <input
                  type="text"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="Database name"
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-postgres-blue"
                  autoFocus
                />
                <Button type="submit" disabled={createDatabase.isPending}>
                  {createDatabase.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewDbName('')
                  }}
                >
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading databases...</div>
          </div>
        ) : databases && databases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {databases.map((db: any) => (
              <Card key={db.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-postgres-blue" />
                      <CardTitle className="text-xl">{db.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDatabase.mutate(db.name)}
                      disabled={deleteDatabase.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <CardDescription>Owner: {db.owner}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{db.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Encoding:</span>
                      <span className="font-medium">{db.encoding}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Collation:</span>
                      <span className="font-medium">{db.collation}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Database className="h-12 w-12 mb-4 opacity-20" />
              <p>No databases found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                Create your first database
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}