'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { DataTable, Column } from '@/components/tables/DataTable'
import { appointmentApi, therapistApi, userApi, storeApi, specialtyApi } from '@/lib/api'
import { Appointment, Therapist, User, Store, Specialty } from '@/types/appointment'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, User as UserIcon, MapPin, Plus, X, Save } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function AppointmentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    userId: '',
    therapistId: '',
    storeId: '',
    specialtyId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
    status: 'scheduled' as Appointment['status'],
  })
  
  // Dropdown data
  const [users, setUsers] = useState<User[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowForm(true)
    }
    fetchAppointments()
    fetchDropdownData()
  }, [searchParams])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentApi.list()
      setAppointments(response.data)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [usersRes, therapistsRes, storesRes, specialtiesRes] = await Promise.all([
        userApi.list({ role: 'patient' }),
        therapistApi.list(),
        storeApi.list(),
        specialtyApi.list(),
      ])
      setUsers(usersRes.data)
      setTherapists(therapistsRes.data)
      setStores(storesRes.data)
      setSpecialties(specialtiesRes.data)
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAppointment) {
        await appointmentApi.update(editingAppointment.id, formData)
      } else {
        await appointmentApi.create(formData)
      }
      setShowForm(false)
      setEditingAppointment(null)
      resetForm()
      fetchAppointments()
    } catch (error) {
      console.error('Failed to save appointment:', error)
      alert('Failed to save appointment. Please try again.')
    }
  }

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setFormData({
      userId: appointment.userId.toString(),
      therapistId: appointment.therapistId.toString(),
      storeId: appointment.storeId.toString(),
      specialtyId: appointment.specialtyId.toString(),
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      notes: appointment.notes || '',
      status: appointment.status,
    })
    setShowForm(true)
  }

  const handleDelete = async (appointment: Appointment) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentApi.delete(appointment.id)
        fetchAppointments()
      } catch (error) {
        console.error('Failed to delete appointment:', error)
        alert('Failed to delete appointment. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      userId: '',
      therapistId: '',
      storeId: '',
      specialtyId: '',
      date: '',
      startTime: '',
      endTime: '',
      notes: '',
      status: 'scheduled',
    })
  }

  const columns: Column<Appointment>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'date',
      header: 'Date',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'startTime',
      header: 'Time',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          {value} - {row.endTime}
        </div>
      ),
    },
    {
      key: 'user.name',
      header: 'Patient',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'therapist.user.name',
      header: 'Therapist',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value || 'N/A'}</div>
          <div className="text-xs text-gray-500">{row.specialty?.name}</div>
        </div>
      ),
    },
    {
      key: 'store.name',
      header: 'Location',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value}
        </span>
      ),
      filterable: true,
    },
    {
      key: 'totalPrice',
      header: 'Price',
      render: (value) => `$${value}`,
      sortable: true,
    },
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-2">Manage all appointment bookings</p>
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setEditingAppointment(null)
                resetForm()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">Select a patient</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.storeId}
                  onChange={(e) => {
                    setFormData({ ...formData, storeId: e.target.value })
                    // Filter therapists by store
                  }}
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.specialtyId}
                  onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                  required
                >
                  <option value="">Select a specialty</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name} ({specialty.duration} min - ${specialty.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Therapist *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.therapistId}
                  onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
                  required
                >
                  <option value="">Select a therapist</option>
                  {therapists
                    .filter((t) => !formData.storeId || t.storeId.toString() === formData.storeId)
                    .map((therapist) => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.user?.name} - {therapist.store?.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingAppointment(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-1" />
                {editingAppointment ? 'Update' : 'Create'} Appointment
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        data={appointments}
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

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading appointments...</div>
        </div>
      </div>
    }>
      <AppointmentsContent />
    </Suspense>
  )
}