import React, { ReactElement } from 'react'
import { render, RenderOptions, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom render function that includes providers
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, createTestQueryClient }

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  role: 'patient' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const mockTherapist = (overrides = {}) => ({
  id: 1,
  userId: 2,
  storeId: 1,
  bio: 'Experienced therapist',
  yearsExperience: 5,
  rating: 4.5,
  totalAppointments: 100,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  user: mockUser({ id: 2, name: 'Jane Smith', role: 'therapist' as const }),
  store: mockStore(),
  specialties: [mockSpecialty()],
  ...overrides,
})

export const mockStore = (overrides = {}) => ({
  id: 1,
  name: 'Main Store',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  phone: '555-0001',
  email: 'store@example.com',
  operatingHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true },
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const mockSpecialty = (overrides = {}) => ({
  id: 1,
  name: 'Swedish Massage',
  description: 'Relaxing full body massage',
  duration: 60,
  price: 80,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const mockAppointment = (overrides = {}) => ({
  id: 1,
  userId: 1,
  therapistId: 1,
  storeId: 1,
  specialtyId: 1,
  date: '2024-06-15',
  startTime: '14:00',
  endTime: '15:00',
  status: 'scheduled' as const,
  notes: 'First appointment',
  totalPrice: 80,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  user: mockUser(),
  therapist: mockTherapist(),
  store: mockStore(),
  specialty: mockSpecialty(),
  ...overrides,
})

export const mockDashboardStats = (overrides = {}) => ({
  totalUsers: 100,
  totalTherapists: 20,
  totalAppointments: 500,
  totalStores: 5,
  todayAppointments: 10,
  weekRevenue: 5000,
  monthRevenue: 20000,
  averageRating: 4.5,
  ...overrides,
})

// Wait for async operations
export const waitForLoadingToFinish = () =>
  waitFor(
    () => {
      const loadingElements = [
        ...screen.queryAllByText(/loading/i),
        ...screen.queryAllByTestId('loading-spinner'),
      ]
      expect(loadingElements).toHaveLength(0)
    },
    { timeout: 3000 }
  )

// Custom matchers
export const expectToBeInTheDocument = (text: string) => {
  expect(screen.getByText(text)).toBeInTheDocument()
}

export const expectNotToBeInTheDocument = (text: string) => {
  expect(screen.queryByText(text)).not.toBeInTheDocument()
}