'use client'

import React, { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { AppointmentChart } from '@/components/dashboard/AppointmentChart'
import { TherapistUtilization } from '@/components/dashboard/TherapistUtilization'
import { DataTable, Column } from '@/components/tables/DataTable'
import { dashboardApi, appointmentApi } from '@/lib/api'
import { DashboardStats, AppointmentTrend, TherapistUtilization as TherapistUtilizationType, Appointment } from '@/types/appointment'
import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTherapists: 0,
    totalAppointments: 0,
    totalStores: 0,
    todayAppointments: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    averageRating: 0,
  })
  const [appointmentTrends, setAppointmentTrends] = useState<AppointmentTrend[]>([])
  const [therapistUtilization, setTherapistUtilization] = useState<TherapistUtilizationType[]>([])
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, trendsRes, utilizationRes, appointmentsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getAppointmentTrends(30),
        dashboardApi.getTherapistUtilization(),
        appointmentApi.list({ status: 'scheduled' }),
      ])

      setStats(statsRes.data)
      setAppointmentTrends(trendsRes.data)
      setTherapistUtilization(utilizationRes.data)
      setRecentAppointments(appointmentsRes.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const appointmentColumns: Column<Appointment>[] = [
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
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: 'therapist.user.name',
      header: 'Therapist',
      render: (value) => value || 'N/A',
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
    },
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome to your appointment booking system dashboard
        </p>
      </div>

      <StatsCards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentChart data={appointmentTrends} loading={loading} />
        <TherapistUtilization data={therapistUtilization} loading={loading} />
      </div>

      <DataTable
        title="Recent Appointments"
        data={recentAppointments}
        columns={appointmentColumns}
        loading={loading}
        pageSize={5}
        searchable={false}
        onAdd={() => router.push('/appointments?action=new')}
        actions={(row) => (
          <button
            onClick={() => router.push(`/appointments/${row.id}`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/appointments')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
          <p className="text-gray-600 mt-2">Manage all appointments</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            View All →
          </span>
        </button>

        <button
          onClick={() => router.push('/therapists')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Therapists</h3>
          <p className="text-gray-600 mt-2">Manage therapist profiles</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            View All →
          </span>
        </button>

        <button
          onClick={() => router.push('/stores')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Stores</h3>
          <p className="text-gray-600 mt-2">Manage clinic locations</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            View All →
          </span>
        </button>

        <button
          onClick={() => router.push('/users')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-gray-600 mt-2">Manage system users</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            View All →
          </span>
        </button>
      </div>
    </div>
  )
}