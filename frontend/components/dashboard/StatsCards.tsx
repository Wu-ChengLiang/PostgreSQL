'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Users, Calendar, Store, UserCheck, TrendingUp, DollarSign, Star, Clock } from 'lucide-react'
import { DashboardStats } from '@/types/appointment'
import { t } from '@/lib/i18n'

interface StatsCardsProps {
  stats: DashboardStats
  loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: t('dashboard.stats.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: t('dashboard.stats.totalTherapists'),
      value: stats.totalTherapists,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: t('dashboard.stats.totalAppointments'),
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: t('dashboard.stats.totalStores'),
      value: stats.totalStores,
      icon: Store,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: t('dashboard.stats.todayAppointments'),
      value: stats.todayAppointments,
      icon: Clock,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: t('dashboard.stats.weekRevenue'),
      value: `¥${stats.weekRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      title: t('dashboard.stats.monthRevenue'),
      value: `¥${stats.monthRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
    },
    {
      title: t('dashboard.stats.averageRating'),
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      suffix: '/ 5.0',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
                {card.suffix && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {card.suffix}
                  </span>
                )}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}