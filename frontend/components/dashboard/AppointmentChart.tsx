'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentTrend } from '@/types/appointment'
import { BarChart3, LineChart, TrendingUp } from 'lucide-react'

interface AppointmentChartProps {
  data: AppointmentTrend[]
  loading?: boolean
}

export function AppointmentChart({ data, loading }: AppointmentChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const maxCount = Math.max(...data.map(d => d.count))
  const maxRevenue = Math.max(...data.map(d => d.revenue))

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Appointment Trends</h3>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <LineChart className="h-4 w-4 mr-1" />
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Bar
          </Button>
        </div>
      </div>

      <div className="relative h-64">
        {chartType === 'line' ? (
          <svg className="w-full h-full" viewBox="0 0 800 256">
            {/* Grid lines */}
            <g className="text-gray-200">
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 40}
                  x2="750"
                  y2={50 + i * 40}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                />
              ))}
            </g>

            {/* Y-axis labels */}
            <g className="text-xs text-gray-500">
              {[0, 1, 2, 3, 4].map(i => (
                <text
                  key={i}
                  x="40"
                  y={210 - i * 40}
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {Math.round((maxCount / 4) * i)}
                </text>
              ))}
            </g>

            {/* Line chart */}
            <path
              d={`M ${data.map((d, i) => `${50 + (i * 700) / (data.length - 1)},${210 - (d.count / maxCount) * 160}`).join(' L ')}`}
              fill="none"
              stroke="rgb(99 102 241)"
              strokeWidth="2"
            />

            {/* Data points */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={50 + (i * 700) / (data.length - 1)}
                cy={210 - (d.count / maxCount) * 160}
                r="4"
                fill="rgb(99 102 241)"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>{`Date: ${new Date(d.date).toLocaleDateString()}\nAppointments: ${d.count}\nRevenue: $${d.revenue}`}</title>
              </circle>
            ))}

            {/* X-axis labels */}
            <g className="text-xs text-gray-500">
              {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d, i, arr) => (
                <text
                  key={i}
                  x={50 + (data.indexOf(d) * 700) / (data.length - 1)}
                  y="235"
                  textAnchor="middle"
                >
                  {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              ))}
            </g>
          </svg>
        ) : (
          <svg className="w-full h-full" viewBox="0 0 800 256">
            {/* Grid lines */}
            <g className="text-gray-200">
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 40}
                  x2="750"
                  y2={50 + i * 40}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                />
              ))}
            </g>

            {/* Y-axis labels */}
            <g className="text-xs text-gray-500">
              {[0, 1, 2, 3, 4].map(i => (
                <text
                  key={i}
                  x="40"
                  y={210 - i * 40}
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {Math.round((maxCount / 4) * i)}
                </text>
              ))}
            </g>

            {/* Bar chart */}
            {data.map((d, i) => {
              const barWidth = 600 / data.length
              const barHeight = (d.count / maxCount) * 160
              return (
                <rect
                  key={i}
                  x={100 + i * barWidth}
                  y={210 - barHeight}
                  width={barWidth * 0.8}
                  height={barHeight}
                  fill="rgb(99 102 241)"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`Date: ${new Date(d.date).toLocaleDateString()}\nAppointments: ${d.count}\nRevenue: $${d.revenue}`}</title>
                </rect>
              )
            })}

            {/* X-axis labels */}
            <g className="text-xs text-gray-500">
              {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d, i, arr) => {
                const index = data.indexOf(d)
                const barWidth = 600 / data.length
                return (
                  <text
                    key={i}
                    x={100 + index * barWidth + barWidth * 0.4}
                    y="235"
                    textAnchor="middle"
                  >
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                )
              })}
            </g>
          </svg>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Appointments</p>
          <p className="text-xl font-semibold text-gray-900">
            {data.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-xl font-semibold text-gray-900">
            ${data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  )
}