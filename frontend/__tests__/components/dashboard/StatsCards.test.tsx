import React from 'react'
import { render, screen, within } from '../../utils/test-utils'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { mockDashboardStats } from '../../utils/test-utils'

describe('StatsCards Component', () => {
  const defaultStats = mockDashboardStats()

  describe('Rendering', () => {
    it('should render all stat cards with correct values', () => {
      render(<StatsCards stats={defaultStats} />)

      // Check all cards are rendered
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()

      expect(screen.getByText('Total Therapists')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()

      expect(screen.getByText('Total Appointments')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()

      expect(screen.getByText('Total Stores')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()

      expect(screen.getByText("Today's Appointments")).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()

      expect(screen.getByText('Week Revenue')).toBeInTheDocument()
      expect(screen.getByText('$5,000')).toBeInTheDocument()

      expect(screen.getByText('Month Revenue')).toBeInTheDocument()
      expect(screen.getByText('$20,000')).toBeInTheDocument()

      expect(screen.getByText('Average Rating')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('/ 5.0')).toBeInTheDocument()
    })

    it('should format large numbers with commas', () => {
      const stats = mockDashboardStats({
        weekRevenue: 1234567,
        monthRevenue: 9876543,
      })

      render(<StatsCards stats={stats} />)

      expect(screen.getByText('$1,234,567')).toBeInTheDocument()
      expect(screen.getByText('$9,876,543')).toBeInTheDocument()
    })

    it('should render correct icons for each card', () => {
      const { container } = render(<StatsCards stats={defaultStats} />)

      // Check that icons are rendered (Lucide icons render as SVGs)
      const cards = container.querySelectorAll('.grid > div')
      expect(cards).toHaveLength(8)

      cards.forEach(card => {
        const icon = card.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should apply correct color schemes to cards', () => {
      const { container } = render(<StatsCards stats={defaultStats} />)

      // Check background colors are applied
      expect(container.querySelector('.bg-blue-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-green-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-purple-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-orange-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-indigo-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-pink-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-teal-50')).toBeInTheDocument()
      expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument()
    })

    it('should format average rating to one decimal place', () => {
      const stats = mockDashboardStats({
        averageRating: 4.567,
      })

      render(<StatsCards stats={stats} />)

      expect(screen.getByText('4.6')).toBeInTheDocument()
    })

    it('should handle zero values correctly', () => {
      const stats = mockDashboardStats({
        totalUsers: 0,
        weekRevenue: 0,
        averageRating: 0,
      })

      render(<StatsCards stats={stats} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('$0')).toBeInTheDocument()
      expect(screen.getByText('0.0')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should render loading skeletons when loading is true', () => {
      const { container } = render(<StatsCards stats={defaultStats} loading={true} />)

      // Check for loading skeletons
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons).toHaveLength(8)

      // Check that actual values are not shown
      expect(screen.queryByText('100')).not.toBeInTheDocument()
      expect(screen.queryByText('Total Users')).not.toBeInTheDocument()
    })

    it('should render actual content when loading is false', () => {
      render(<StatsCards stats={defaultStats} loading={false} />)

      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      expect(screen.getByText('Total Users')).toBeInTheDocument()
    })
  })

  describe('Responsiveness', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<StatsCards stats={defaultStats} />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })
  })

  describe('Hover Effects', () => {
    it('should have hover effects on cards', () => {
      const { container } = render(<StatsCards stats={defaultStats} />)

      const cards = container.querySelectorAll('.hover\\:shadow-lg')
      expect(cards).toHaveLength(8)

      cards.forEach(card => {
        expect(card).toHaveClass('transition-shadow')
        expect(card).toHaveClass('duration-200')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative revenue values', () => {
      const stats = mockDashboardStats({
        weekRevenue: -1000,
        monthRevenue: -5000,
      })

      render(<StatsCards stats={stats} />)

      expect(screen.getByText('$-1,000')).toBeInTheDocument()
      expect(screen.getByText('$-5,000')).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const stats = mockDashboardStats({
        totalAppointments: 999999999,
        monthRevenue: 123456789012,
      })

      render(<StatsCards stats={stats} />)

      expect(screen.getByText('999999999')).toBeInTheDocument()
      expect(screen.getByText('$123,456,789,012')).toBeInTheDocument()
    })

    it('should handle decimal revenue values', () => {
      const stats = mockDashboardStats({
        weekRevenue: 1234.56,
        monthRevenue: 9876.54,
      })

      render(<StatsCards stats={stats} />)

      // toLocaleString will format these based on locale
      expect(screen.getByText('$1,234.56')).toBeInTheDocument()
      expect(screen.getByText('$9,876.54')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<StatsCards stats={defaultStats} />)

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings).toHaveLength(8)
    })

    it('should have descriptive text for screen readers', () => {
      render(<StatsCards stats={defaultStats} />)

      // All card titles should be accessible
      const cardTitles = [
        'Total Users',
        'Total Therapists',
        'Total Appointments',
        'Total Stores',
        "Today's Appointments",
        'Week Revenue',
        'Month Revenue',
        'Average Rating',
      ]

      cardTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    })
  })
})