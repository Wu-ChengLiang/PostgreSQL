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
import { t } from '@/lib/i18n'

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
      
      // 获取仪表板统计数据
      try {
        const statsRes = await dashboardApi.getStats()
        if (statsRes.data?.stats) {
          setStats({
            totalUsers: statsRes.data.stats.total_users || 0,
            totalTherapists: statsRes.data.stats.total_therapists || 0,
            totalAppointments: statsRes.data.stats.total_appointments || 0,
            totalStores: statsRes.data.stats.total_stores || 0,
            todayAppointments: statsRes.data.stats.today_appointments || 0,
            weekRevenue: 0,
            monthRevenue: 0,
            averageRating: 4.5,
          })
          
          // 设置预约趋势
          if (statsRes.data.stats.appointment_trend) {
            setAppointmentTrends(statsRes.data.stats.appointment_trend.map((item: any) => ({
              date: item.date,
              count: item.count,
              revenue: item.count * 200 // 假设每个预约200元
            })))
          }
          
          // 设置技师利用率
          if (statsRes.data.stats.therapist_utilization) {
            setTherapistUtilization(statsRes.data.stats.therapist_utilization.map((item: any) => ({
              id: item.id,
              name: item.name,
              utilization: item.utilization_rate || 0,
              appointments: item.appointment_count || 0,
              revenue: item.appointment_count * 200 || 0
            })))
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
      
      // 获取最近预约
      try {
        const appointmentsRes = await appointmentApi.list()
        if (appointmentsRes.data?.appointments) {
          setRecentAppointments(appointmentsRes.data.appointments.slice(0, 5))
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error)
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const appointmentColumns: Column<Appointment>[] = [
    {
      key: 'appointment_date',
      header: t('appointment.fields.date'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {value ? new Date(value).toLocaleDateString('zh-CN') : '-'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'start_time',
      header: t('appointment.fields.time'),
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          {value || '-'} - {(row as any).end_time || '-'}
        </div>
      ),
    },
    {
      key: 'user_name',
      header: t('appointment.fields.patient'),
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          {value || (row as any).user?.username || '-'}
        </div>
      ),
    },
    {
      key: 'therapist_name',
      header: t('appointment.fields.therapist'),
      render: (value, row) => value || (row as any).therapist?.name || '-',
    },
    {
      key: 'store_name',
      header: t('appointment.fields.location'),
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          {value || (row as any).store?.name || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('appointment.fields.status'),
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : value === 'confirmed'
              ? 'bg-green-100 text-green-800'
              : value === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {t(`appointment.status.${value}`) || value}
        </span>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mt-2">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <StatsCards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentChart data={appointmentTrends} loading={loading} />
        <TherapistUtilization data={therapistUtilization} loading={loading} />
      </div>

      <DataTable
        title={t('dashboard.table.recentAppointments')}
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
            {t('common.viewDetails')}
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/appointments')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.cards.appointments')}</h3>
          <p className="text-gray-600 mt-2">{t('dashboard.cards.appointmentsDesc')}</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            {t('common.viewAll')} →
          </span>
        </button>

        <button
          onClick={() => router.push('/therapists')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.cards.therapists')}</h3>
          <p className="text-gray-600 mt-2">{t('dashboard.cards.therapistsDesc')}</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            {t('common.viewAll')} →
          </span>
        </button>

        <button
          onClick={() => router.push('/stores')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.cards.stores')}</h3>
          <p className="text-gray-600 mt-2">{t('dashboard.cards.storesDesc')}</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            {t('common.viewAll')} →
          </span>
        </button>

        <button
          onClick={() => router.push('/users')}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.cards.users')}</h3>
          <p className="text-gray-600 mt-2">{t('dashboard.cards.usersDesc')}</p>
          <span className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            {t('common.viewAll')} →
          </span>
        </button>
      </div>
    </div>
  )
}