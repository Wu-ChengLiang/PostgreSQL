import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { api } from '@/lib/api'
import AppointmentsPage from '@/app/appointments/page'
import { mockAppointment, mockUser, mockTherapist, mockStore, mockSpecialty } from '../utils/test-utils'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/appointments'),
}))

describe('Appointments Page Integration', () => {
  let mock: MockAdapter
  let mockPush: jest.Mock
  let mockRouter: any

  beforeEach(() => {
    mock = new MockAdapter(api)
    mockPush = jest.fn()
    mockRouter = {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    // Setup default API responses
    mock.onGet('/api/appointments').reply(200, [
      mockAppointment(),
      mockAppointment({ id: 2, status: 'completed' }),
      mockAppointment({ id: 3, status: 'cancelled' }),
    ])

    mock.onGet('/api/users', { params: { role: 'patient' } }).reply(200, [
      mockUser(),
      mockUser({ id: 2, name: 'Alice Cooper', email: 'alice@example.com' }),
    ])

    mock.onGet('/api/therapists').reply(200, [
      mockTherapist(),
      mockTherapist({ id: 2, userId: 3 }),
    ])

    mock.onGet('/api/stores').reply(200, [
      mockStore(),
      mockStore({ id: 2, name: 'Downtown Store' }),
    ])

    mock.onGet('/api/specialties').reply(200, [
      mockSpecialty(),
      mockSpecialty({ id: 2, name: 'Deep Tissue Massage' }),
    ])
  })

  afterEach(() => {
    mock.restore()
    jest.clearAllMocks()
  })

  describe('Page Loading', () => {
    it('should load appointments and display them in the table', async () => {
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Appointments')).toBeInTheDocument()
        expect(screen.getByText('Manage all appointment bookings')).toBeInTheDocument()
      })

      // Check appointments are displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('scheduled')).toBeInTheDocument()
        expect(screen.getByText('completed')).toBeInTheDocument()
        expect(screen.getByText('cancelled')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      mock.onGet('/api/appointments').reply(500)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch appointments:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    it('should show loading state initially', () => {
      const { container } = render(<AppointmentsPage />)
      
      const loadingElement = container.querySelector('.animate-pulse')
      expect(loadingElement).toBeInTheDocument()
    })
  })

  describe('Form Display', () => {
    it('should show form when Add New button is clicked', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))

      expect(screen.getByText('New Appointment')).toBeInTheDocument()
      expect(screen.getByLabelText('Patient *')).toBeInTheDocument()
      expect(screen.getByLabelText('Therapist *')).toBeInTheDocument()
    })

    it('should show form when action=new in query params', async () => {
      ;(useSearchParams as jest.Mock).mockReturnValue(
        new URLSearchParams({ action: 'new' })
      )

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('New Appointment')).toBeInTheDocument()
      })
    })

    it('should populate dropdowns with fetched data', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))

      const patientSelect = screen.getByLabelText('Patient *') as HTMLSelectElement
      const storeSelect = screen.getByLabelText('Store *') as HTMLSelectElement

      await waitFor(() => {
        expect(patientSelect.options).toHaveLength(3) // empty + 2 users
        expect(storeSelect.options).toHaveLength(3) // empty + 2 stores
      })
    })
  })

  describe('Creating Appointments', () => {
    it('should create new appointment successfully', async () => {
      const user = userEvent.setup()
      const newAppointment = {
        userId: '1',
        therapistId: '1',
        storeId: '1',
        specialtyId: '1',
        date: '2024-06-20',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Test appointment',
        status: 'scheduled',
      }

      mock.onPost('/api/appointments').reply(201, mockAppointment(newAppointment))

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))

      // Fill form
      await user.selectOptions(screen.getByLabelText('Patient *'), '1')
      await user.selectOptions(screen.getByLabelText('Store *'), '1')
      await user.selectOptions(screen.getByLabelText('Specialty *'), '1')
      await user.selectOptions(screen.getByLabelText('Therapist *'), '1')
      await user.type(screen.getByLabelText('Date *'), '2024-06-20')
      await user.type(screen.getByLabelText('Start Time *'), '10:00')
      await user.type(screen.getByLabelText('End Time *'), '11:00')
      await user.type(screen.getByLabelText('Notes'), 'Test appointment')

      // Submit form
      await user.click(screen.getByText('Create Appointment'))

      await waitFor(() => {
        expect(mock.history.post).toHaveLength(1)
        expect(JSON.parse(mock.history.post[0].data)).toEqual(newAppointment)
      })

      // Form should close
      await waitFor(() => {
        expect(screen.queryByText('New Appointment')).not.toBeInTheDocument()
      })
    })

    it('should handle validation errors', async () => {
      const user = userEvent.setup()
      window.alert = jest.fn()

      mock.onPost('/api/appointments').reply(400, { message: 'Invalid data' })

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))
      await user.click(screen.getByText('Create Appointment'))

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to save appointment. Please try again.'
        )
      })
    })

    it('should filter therapists by selected store', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))

      const therapistSelect = screen.getByLabelText('Therapist *') as HTMLSelectElement

      // Initially all therapists
      await waitFor(() => {
        expect(therapistSelect.options).toHaveLength(3) // empty + 2 therapists
      })

      // Select store 1
      await user.selectOptions(screen.getByLabelText('Store *'), '1')

      // Should filter therapists
      const filteredOptions = Array.from(therapistSelect.options).filter(
        opt => opt.value === '' || opt.text.includes('Main Store')
      )
      expect(filteredOptions).toHaveLength(2) // empty + 1 therapist
    })
  })

  describe('Editing Appointments', () => {
    it('should populate form with appointment data when editing', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit')
        expect(editButtons).toHaveLength(3)
      })

      await user.click(screen.getAllByText('Edit')[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Appointment')).toBeInTheDocument()
        expect(screen.getByLabelText('Patient *')).toHaveValue('1')
        expect(screen.getByLabelText('Date *')).toHaveValue('2024-06-15')
        expect(screen.getByLabelText('Notes')).toHaveValue('First appointment')
      })
    })

    it('should update appointment successfully', async () => {
      const user = userEvent.setup()
      const updatedData = { status: 'completed', notes: 'Updated notes' }

      mock.onPut('/api/appointments/1').reply(200, mockAppointment(updatedData))

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Edit')).toHaveLength(3)
      })

      await user.click(screen.getAllByText('Edit')[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Appointment')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText('Status'), 'completed')
      await user.clear(screen.getByLabelText('Notes'))
      await user.type(screen.getByLabelText('Notes'), 'Updated notes')

      await user.click(screen.getByText('Update Appointment'))

      await waitFor(() => {
        expect(mock.history.put).toHaveLength(1)
        expect(screen.queryByText('Edit Appointment')).not.toBeInTheDocument()
      })
    })
  })

  describe('Deleting Appointments', () => {
    it('should delete appointment after confirmation', async () => {
      const user = userEvent.setup()
      window.confirm = jest.fn(() => true)

      mock.onDelete('/api/appointments/1').reply(204)

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Delete')).toHaveLength(3)
      })

      await user.click(screen.getAllByText('Delete')[0])

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this appointment?'
      )

      await waitFor(() => {
        expect(mock.history.delete).toHaveLength(1)
        expect(mock.history.delete[0].url).toBe('/api/appointments/1')
      })
    })

    it('should not delete appointment if user cancels', async () => {
      const user = userEvent.setup()
      window.confirm = jest.fn(() => false)

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Delete')).toHaveLength(3)
      })

      await user.click(screen.getAllByText('Delete')[0])

      expect(window.confirm).toHaveBeenCalled()
      expect(mock.history.delete).toHaveLength(0)
    })

    it('should handle delete errors', async () => {
      const user = userEvent.setup()
      window.confirm = jest.fn(() => true)
      window.alert = jest.fn()

      mock.onDelete('/api/appointments/1').reply(500)

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Delete')).toHaveLength(3)
      })

      await user.click(screen.getAllByText('Delete')[0])

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to delete appointment. Please try again.'
        )
      })
    })
  })

  describe('Table Features', () => {
    it('should display appointment details correctly', async () => {
      render(<AppointmentsPage />)

      await waitFor(() => {
        // Check date formatting
        expect(screen.getByText('6/15/2024')).toBeInTheDocument()
        
        // Check time display
        expect(screen.getByText('14:00 - 15:00')).toBeInTheDocument()
        
        // Check patient info
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        
        // Check price formatting
        expect(screen.getByText('$80')).toBeInTheDocument()
      })
    })

    it('should show status badges with correct colors', async () => {
      render(<AppointmentsPage />)

      await waitFor(() => {
        const scheduledBadge = screen.getByText('scheduled')
        const completedBadge = screen.getByText('completed')
        const cancelledBadge = screen.getByText('cancelled')

        expect(scheduledBadge).toHaveClass('bg-blue-100', 'text-blue-800')
        expect(completedBadge).toHaveClass('bg-green-100', 'text-green-800')
        expect(cancelledBadge).toHaveClass('bg-red-100', 'text-red-800')
      })
    })

    it('should handle pagination of appointments', async () => {
      // Create many appointments
      const manyAppointments = Array.from({ length: 25 }, (_, i) =>
        mockAppointment({ id: i + 1 })
      )
      mock.onGet('/api/appointments').reply(200, manyAppointments)

      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Showing 1 to 20 of 25 results')).toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions', () => {
    it('should close form when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))
      expect(screen.getByText('New Appointment')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByText('New Appointment')).not.toBeInTheDocument()
    })

    it('should close form when X button is clicked', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      expect(screen.queryByText('New Appointment')).not.toBeInTheDocument()
    })

    it('should reset form when switching from edit to new', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      // Edit an appointment
      await waitFor(() => {
        expect(screen.getAllByText('Edit')).toHaveLength(3)
      })

      await user.click(screen.getAllByText('Edit')[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Appointment')).toBeInTheDocument()
        expect(screen.getByLabelText('Notes')).toHaveValue('First appointment')
      })

      // Close and open new form
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      await user.click(screen.getByText('Add New'))

      expect(screen.getByText('New Appointment')).toBeInTheDocument()
      expect(screen.getByLabelText('Notes')).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      const user = userEvent.setup()
      render(<AppointmentsPage />)

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add New'))

      const requiredFields = [
        'Patient *',
        'Store *',
        'Specialty *',
        'Therapist *',
        'Date *',
        'Start Time *',
        'End Time *',
      ]

      requiredFields.forEach(field => {
        expect(screen.getByLabelText(field)).toBeInTheDocument()
      })
    })

    it('should have accessible table structure', async () => {
      render(<AppointmentsPage />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        const headers = within(table).getAllByRole('columnheader')
        expect(headers).toHaveLength(9) // Including actions column
      })
    })
  })
})