'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { TherapistUtilization as TherapistUtilizationType } from '@/types/appointment'
import { Activity, DollarSign, TrendingUp } from 'lucide-react'

interface TherapistUtilizationProps {
  data: TherapistUtilizationType[]
  loading?: boolean
}

export function TherapistUtilization({ data, loading }: TherapistUtilizationProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  const sortedData = [...data].sort((a, b) => b.utilizationRate - a.utilizationRate)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Therapist Utilization</h3>
          <p className="text-sm text-gray-500 mt-1">Current month performance</p>
        </div>
        <Activity className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {sortedData.map((therapist) => (
          <div
            key={therapist.therapistId}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{therapist.therapistName}</h4>
                <p className="text-sm text-gray-500">{therapist.storeName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {therapist.utilizationRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {therapist.bookedSlots}/{therapist.totalSlots} slots
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    therapist.utilizationRate >= 80
                      ? 'bg-green-500'
                      : therapist.utilizationRate >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${therapist.utilizationRate}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>Revenue: ${therapist.revenue.toLocaleString()}</span>
              </div>
              <div
                className={`flex items-center ${
                  therapist.utilizationRate >= 80
                    ? 'text-green-600'
                    : therapist.utilizationRate >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>
                  {therapist.utilizationRate >= 80
                    ? 'Excellent'
                    : therapist.utilizationRate >= 60
                    ? 'Good'
                    : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No utilization data available
        </div>
      )}
    </Card>
  )
}