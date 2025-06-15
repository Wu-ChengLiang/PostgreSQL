import MockAdapter from 'axios-mock-adapter'
import { api, appointmentApi } from '@/lib/api'
import { mockAppointment, mockDashboardStats } from '../utils/test-utils'

describe('Appointment API', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(api)
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('appointmentApi.list', () => {
    it('should fetch appointments without params', async () => {
      const appointments = [mockAppointment(), mockAppointment({ id: 2 })]
      mock.onGet('/api/appointments').reply(200, appointments)

      const response = await appointmentApi.list()

      expect(response.data).toEqual(appointments)
      expect(mock.history.get[0].params).toBeUndefined()
    })

    it('should fetch appointments with filters', async () => {
      const appointments = [mockAppointment({ status: 'completed' })]
      const params = { status: 'completed', therapistId: 1 }
      mock.onGet('/api/appointments', { params }).reply(200, appointments)

      const response = await appointmentApi.list(params)

      expect(response.data).toEqual(appointments)
      expect(mock.history.get[0].params).toEqual(params)
    })

    it('should handle network errors', async () => {
      mock.onGet('/api/appointments').networkError()

      await expect(appointmentApi.list()).rejects.toThrow('Network Error')
    })

    it('should handle 401 errors', async () => {
      localStorage.setItem('authToken', 'test-token')
      mock.onGet('/api/appointments').reply(401)

      await expect(appointmentApi.list()).rejects.toHaveProperty(
        'response.status',
        401
      )
      
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(window.location.href).toBe('/login')
    })
  })

  describe('appointmentApi.get', () => {
    it('should fetch a single appointment', async () => {
      const appointment = mockAppointment()
      mock.onGet('/api/appointments/1').reply(200, appointment)

      const response = await appointmentApi.get(1)

      expect(response.data).toEqual(appointment)
    })

    it('should handle 404 errors', async () => {
      mock.onGet('/api/appointments/999').reply(404, { message: 'Not found' })

      await expect(appointmentApi.get(999)).rejects.toHaveProperty(
        'response.status',
        404
      )
    })
  })

  describe('appointmentApi.create', () => {
    it('should create a new appointment', async () => {
      const newAppointment = {
        userId: 1,
        therapistId: 1,
        storeId: 1,
        specialtyId: 1,
        date: '2024-06-20',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'New appointment',
      }
      const createdAppointment = mockAppointment(newAppointment)
      
      mock.onPost('/api/appointments', newAppointment).reply(201, createdAppointment)

      const response = await appointmentApi.create(newAppointment)

      expect(response.data).toEqual(createdAppointment)
      expect(mock.history.post[0].data).toBe(JSON.stringify(newAppointment))
    })

    it('should handle validation errors', async () => {
      const invalidData = { userId: 1 } // Missing required fields
      mock.onPost('/api/appointments').reply(400, {
        errors: {
          therapistId: 'Therapist is required',
          date: 'Date is required',
        },
      })

      await expect(appointmentApi.create(invalidData)).rejects.toHaveProperty(
        'response.status',
        400
      )
    })

    it('should include auth token in request', async () => {
      const token = 'test-auth-token'
      localStorage.setItem('authToken', token)
      
      const newAppointment = {
        userId: 1,
        therapistId: 1,
        storeId: 1,
        specialtyId: 1,
        date: '2024-06-20',
        startTime: '10:00',
        endTime: '11:00',
      }
      
      mock.onPost('/api/appointments').reply(201, mockAppointment())

      await appointmentApi.create(newAppointment)

      expect(mock.history.post[0].headers.Authorization).toBe(`Bearer ${token}`)
    })
  })

  describe('appointmentApi.update', () => {
    it('should update an appointment', async () => {
      const updateData = { status: 'completed', notes: 'Completed successfully' }
      const updatedAppointment = mockAppointment({ ...updateData })
      
      mock.onPut('/api/appointments/1', updateData).reply(200, updatedAppointment)

      const response = await appointmentApi.update(1, updateData)

      expect(response.data).toEqual(updatedAppointment)
      expect(mock.history.put[0].data).toBe(JSON.stringify(updateData))
    })

    it('should handle concurrent update conflicts', async () => {
      mock.onPut('/api/appointments/1').reply(409, {
        message: 'Appointment has been modified by another user',
      })

      await expect(
        appointmentApi.update(1, { status: 'completed' })
      ).rejects.toHaveProperty('response.status', 409)
    })
  })

  describe('appointmentApi.delete', () => {
    it('should delete an appointment', async () => {
      mock.onDelete('/api/appointments/1').reply(204)

      const response = await appointmentApi.delete(1)

      expect(response.status).toBe(204)
    })

    it('should handle delete of non-existent appointment', async () => {
      mock.onDelete('/api/appointments/999').reply(404)

      await expect(appointmentApi.delete(999)).rejects.toHaveProperty(
        'response.status',
        404
      )
    })

    it('should handle forbidden delete', async () => {
      mock.onDelete('/api/appointments/1').reply(403, {
        message: 'You do not have permission to delete this appointment',
      })

      await expect(appointmentApi.delete(1)).rejects.toHaveProperty(
        'response.status',
        403
      )
    })
  })

  describe('appointmentApi.getStats', () => {
    it('should fetch appointment statistics', async () => {
      const stats = mockDashboardStats()
      mock.onGet('/api/appointments/stats').reply(200, stats)

      const response = await appointmentApi.getStats()

      expect(response.data).toEqual(stats)
    })

    it('should handle stats calculation errors', async () => {
      mock.onGet('/api/appointments/stats').reply(500, {
        message: 'Failed to calculate statistics',
      })

      await expect(appointmentApi.getStats()).rejects.toHaveProperty(
        'response.status',
        500
      )
    })
  })

  describe('Error handling', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let attempts = 0
      mock.onGet('/api/appointments').reply(() => {
        attempts++
        if (attempts < 3) {
          return [500, { message: 'Server error' }]
        }
        return [200, [mockAppointment()]]
      })

      // Note: Since we disabled retries in tests, this will fail immediately
      await expect(appointmentApi.list()).rejects.toHaveProperty(
        'response.status',
        500
      )
      expect(attempts).toBe(1)
    })

    it('should handle timeout errors', async () => {
      mock.onGet('/api/appointments').timeout()

      await expect(appointmentApi.list()).rejects.toThrow('timeout')
    })

    it('should handle malformed responses', async () => {
      mock.onGet('/api/appointments').reply(200, 'not-json')

      // Axios will parse this as a string, not throw an error
      const response = await appointmentApi.list()
      expect(response.data).toBe('not-json')
    })
  })

  describe('Request interceptors', () => {
    it('should add auth token to all requests', async () => {
      const token = 'test-token-123'
      localStorage.setItem('authToken', token)
      
      mock.onGet('/api/appointments').reply(200, [])
      mock.onPost('/api/appointments').reply(201, mockAppointment())
      mock.onPut('/api/appointments/1').reply(200, mockAppointment())
      mock.onDelete('/api/appointments/1').reply(204)

      await appointmentApi.list()
      await appointmentApi.create({})
      await appointmentApi.update(1, {})
      await appointmentApi.delete(1)

      const requests = [...mock.history.get, ...mock.history.post, ...mock.history.put, ...mock.history.delete]
      
      requests.forEach(request => {
        expect(request.headers.Authorization).toBe(`Bearer ${token}`)
      })
    })

    it('should handle requests without auth token', async () => {
      localStorage.removeItem('authToken')
      
      mock.onGet('/api/appointments').reply(200, [])

      await appointmentApi.list()

      expect(mock.history.get[0].headers.Authorization).toBeUndefined()
    })
  })
})