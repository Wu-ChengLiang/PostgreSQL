'use client'

import React, { useState, useEffect } from 'react'
import { DataTable, Column } from '@/components/tables/DataTable'
import { therapistApi, userApi, storeApi, specialtyApi } from '@/lib/api'
import { Therapist, User, Store, Specialty, TherapistSchedule } from '@/types/appointment'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserCheck, Star, Calendar, MapPin, Plus, X, Save, Clock } from 'lucide-react'

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null)
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [schedules, setSchedules] = useState<TherapistSchedule[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    userId: '',
    storeId: '',
    bio: '',
    yearsExperience: 0,
    specialtyIds: [] as string[],
  })

  const [scheduleFormData, setScheduleFormData] = useState({
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    isAvailable: true,
  })
  
  // Dropdown data
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])

  useEffect(() => {
    fetchTherapists()
    fetchDropdownData()
  }, [])

  const fetchTherapists = async () => {
    try {
      setLoading(true)
      const response = await therapistApi.list()
      setTherapists(response.data)
    } catch (error) {
      console.error('Failed to fetch therapists:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [usersRes, storesRes, specialtiesRes] = await Promise.all([
        userApi.list({ role: 'therapist' }),
        storeApi.list(),
        specialtyApi.list(),
      ])
      setUsers(usersRes.data)
      setStores(storesRes.data)
      setSpecialties(specialtiesRes.data)
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    }
  }

  const fetchSchedules = async (therapistId: number) => {
    try {
      const response = await therapistApi.getSchedules(therapistId)
      setSchedules(response.data)
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTherapist) {
        await therapistApi.update(editingTherapist.id, formData)
      } else {
        await therapistApi.create(formData)
      }
      setShowForm(false)
      setEditingTherapist(null)
      resetForm()
      fetchTherapists()
    } catch (error) {
      console.error('Failed to save therapist:', error)
      alert('Failed to save therapist. Please try again.')
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTherapist) return

    try {
      await therapistApi.createSchedule(selectedTherapist.id, scheduleFormData)
      setShowScheduleForm(false)
      resetScheduleForm()
      fetchSchedules(selectedTherapist.id)
    } catch (error) {
      console.error('Failed to save schedule:', error)
      alert('Failed to save schedule. Please try again.')
    }
  }

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist(therapist)
    setFormData({
      userId: therapist.userId.toString(),
      storeId: therapist.storeId.toString(),
      bio: therapist.bio || '',
      yearsExperience: therapist.yearsExperience,
      specialtyIds: therapist.specialties?.map(s => s.id.toString()) || [],
    })
    setShowForm(true)
  }

  const handleDelete = async (therapist: Therapist) => {
    if (confirm('Are you sure you want to delete this therapist?')) {
      try {
        await therapistApi.delete(therapist.id)
        fetchTherapists()
      } catch (error) {
        console.error('Failed to delete therapist:', error)
        alert('Failed to delete therapist. Please try again.')
      }
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!selectedTherapist || !confirm('Are you sure you want to delete this schedule?')) return

    try {
      await therapistApi.deleteSchedule(selectedTherapist.id, scheduleId)
      fetchSchedules(selectedTherapist.id)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      alert('Failed to delete schedule. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      userId: '',
      storeId: '',
      bio: '',
      yearsExperience: 0,
      specialtyIds: [],
    })
  }

  const resetScheduleForm = () => {
    setScheduleFormData({
      dayOfWeek: 0,
      startTime: '',
      endTime: '',
      isAvailable: true,
    })
  }

  const columns: Column<Therapist>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'user.name',
      header: 'Therapist',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'store.name',
      header: 'Location',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div>
            <div>{value}</div>
            <div className="text-xs text-gray-500">{row.store?.city}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialties',
      header: 'Specialties',
      render: (value: Specialty[]) => (
        <div className="flex flex-wrap gap-1">
          {value?.map((specialty) => (
            <span
              key={specialty.id}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
            >
              {specialty.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'yearsExperience',
      header: 'Experience',
      render: (value) => `${value} years`,
      sortable: true,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span>{value?.toFixed(1) || 'N/A'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'totalAppointments',
      header: 'Total Appointments',
      sortable: true,
    },
  ]

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Therapists</h1>
        <p className="text-gray-500 mt-2">Manage therapist profiles and schedules</p>
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingTherapist ? 'Edit Therapist' : 'New Therapist'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setEditingTherapist(null)
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
                  User *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  disabled={!!editingTherapist}
                >
                  <option value="">Select a user</option>
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
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
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
                  Years of Experience *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) })}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialties *
                </label>
                <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {specialties.map((specialty) => (
                    <label key={specialty.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={specialty.id}
                        checked={formData.specialtyIds.includes(specialty.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              specialtyIds: [...formData.specialtyIds, specialty.id.toString()],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              specialtyIds: formData.specialtyIds.filter(id => id !== specialty.id.toString()),
                            })
                          }
                        }}
                      />
                      <span className="text-sm">{specialty.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about your experience and specializations..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingTherapist(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-1" />
                {editingTherapist ? 'Update' : 'Create'} Therapist
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        data={therapists}
        columns={columns}
        loading={loading}
        onAdd={() => setShowForm(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pageSize={20}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTherapist(row)
                fetchSchedules(row.id)
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Schedules
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(row)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        )}
      />

      {selectedTherapist && (
        <Card className="mt-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Schedule for {selectedTherapist.user?.name}
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowScheduleForm(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTherapist(null)
                  setSchedules([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showScheduleForm && (
            <form onSubmit={handleScheduleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={scheduleFormData.dayOfWeek}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, dayOfWeek: parseInt(e.target.value) })}
                    required
                  >
                    {dayNames.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={scheduleFormData.startTime}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
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
                    value={scheduleFormData.endTime}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowScheduleForm(false)
                      resetScheduleForm()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {schedules.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No schedules defined</p>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{dayNames[schedule.dayOfWeek]}</span>
                    <span className="text-gray-600">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                    {!schedule.isAvailable && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}