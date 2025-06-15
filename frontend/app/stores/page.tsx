'use client'

import React, { useState, useEffect } from 'react'
import { DataTable, Column } from '@/components/tables/DataTable'
import { storeApi } from '@/lib/api'
import { Store, OperatingHours, DayHours } from '@/types/appointment'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Phone, Mail, Clock, Plus, X, Save } from 'lucide-react'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    operatingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    } as OperatingHours,
  })

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const response = await storeApi.list()
      setStores(response.data)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStore) {
        await storeApi.update(editingStore.id, formData)
      } else {
        await storeApi.create(formData)
      }
      setShowForm(false)
      setEditingStore(null)
      resetForm()
      fetchStores()
    } catch (error) {
      console.error('Failed to save store:', error)
      alert('Failed to save store. Please try again.')
    }
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setFormData({
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zipCode: store.zipCode,
      phone: store.phone,
      email: store.email || '',
      operatingHours: store.operatingHours,
    })
    setShowForm(true)
  }

  const handleDelete = async (store: Store) => {
    if (confirm('Are you sure you want to delete this store? This will affect all associated therapists and appointments.')) {
      try {
        await storeApi.delete(store.id)
        fetchStores()
      } catch (error) {
        console.error('Failed to delete store:', error)
        alert('Failed to delete store. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      operatingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '', close: '', closed: true },
      },
    })
  }

  const updateDayHours = (day: keyof OperatingHours, field: keyof DayHours, value: any) => {
    setFormData({
      ...formData,
      operatingHours: {
        ...formData.operatingHours,
        [day]: {
          ...formData.operatingHours[day],
          [field]: value,
        },
      },
    })
  }

  const columns: Column<Store>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'name',
      header: 'Store Name',
      render: (value) => (
        <div className="font-medium">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'address',
      header: 'Address',
      render: (value, row) => (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <div>{value}</div>
            <div className="text-sm text-gray-500">
              {row.city}, {row.state} {row.zipCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{value}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'operatingHours',
      header: 'Hours Today',
      render: (value: OperatingHours) => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof OperatingHours
        const todayHours = value[today]
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              {todayHours.closed ? 'Closed' : `${todayHours.open} - ${todayHours.close}`}
            </span>
          </div>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
  ]

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
        <p className="text-gray-500 mt-2">Manage clinic locations and branches</p>
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingStore ? 'Edit Store' : 'New Store'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setEditingStore(null)
                resetForm()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Operating Hours</h3>
              <div className="space-y-2">
                {dayNames.map((day) => (
                  <div key={day} className="grid grid-cols-4 gap-2 items-center">
                    <div className="capitalize font-medium text-sm">{day}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!formData.operatingHours[day].closed}
                          onChange={(e) => updateDayHours(day, 'closed', !e.target.checked)}
                        />
                        <span className="text-sm">Open</span>
                      </label>
                      {!formData.operatingHours[day].closed && (
                        <>
                          <input
                            type="time"
                            className="px-2 py-1 border rounded text-sm"
                            value={formData.operatingHours[day].open}
                            onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                            required
                          />
                          <span className="text-sm">to</span>
                          <input
                            type="time"
                            className="px-2 py-1 border rounded text-sm"
                            value={formData.operatingHours[day].close}
                            onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                            required
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingStore(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-1" />
                {editingStore ? 'Update' : 'Create'} Store
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        data={stores}
        columns={columns}
        loading={loading}
        onAdd={() => setShowForm(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pageSize={20}
      />
    </div>
  )
}