import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const databaseApi = {
  list: () => api.get('/databases'),
  get: (name: string) => api.get(`/databases/${name}`),
  create: (data: { name: string }) => api.post('/databases', data),
  delete: (name: string) => api.delete(`/databases/${name}`),
  getStats: (name: string) => api.get(`/databases/${name}/stats`),
}

export const tableApi = {
  list: (database: string) => api.get(`/databases/${database}/tables`),
  get: (database: string, table: string) => api.get(`/databases/${database}/tables/${table}`),
  create: (database: string, data: any) => api.post(`/databases/${database}/tables`, data),
  delete: (database: string, table: string) => api.delete(`/databases/${database}/tables/${table}`),
}

export const queryApi = {
  execute: (database: string, query: string) => 
    api.post(`/databases/${database}/query`, { query }),
}

// Appointment Booking System APIs
export const appointmentApi = {
  list: (params?: { status?: string; therapistId?: number; userId?: number; date?: string }) => 
    api.get('/api/appointments', { params }),
  get: (id: number) => api.get(`/api/appointments/${id}`),
  create: (data: any) => api.post('/api/appointments', data),
  update: (id: number, data: any) => api.put(`/api/appointments/${id}`, data),
  delete: (id: number) => api.delete(`/api/appointments/${id}`),
  getStats: () => api.get('/api/appointments/stats'),
}

export const therapistApi = {
  list: (params?: { storeId?: number; specialtyId?: number }) => 
    api.get('/api/therapists', { params }),
  get: (id: number) => api.get(`/api/therapists/${id}`),
  create: (data: any) => api.post('/api/therapists', data),
  update: (id: number, data: any) => api.put(`/api/therapists/${id}`, data),
  delete: (id: number) => api.delete(`/api/therapists/${id}`),
  getSchedules: (id: number) => api.get(`/api/therapists/${id}/schedules`),
  createSchedule: (id: number, data: any) => api.post(`/api/therapists/${id}/schedules`, data),
  updateSchedule: (id: number, scheduleId: number, data: any) => 
    api.put(`/api/therapists/${id}/schedules/${scheduleId}`, data),
  deleteSchedule: (id: number, scheduleId: number) => 
    api.delete(`/api/therapists/${id}/schedules/${scheduleId}`),
  getUtilization: () => api.get('/api/therapists/utilization'),
}

export const storeApi = {
  list: () => api.get('/api/stores'),
  get: (id: number) => api.get(`/api/stores/${id}`),
  create: (data: any) => api.post('/api/stores', data),
  update: (id: number, data: any) => api.put(`/api/stores/${id}`, data),
  delete: (id: number) => api.delete(`/api/stores/${id}`),
}

export const userApi = {
  list: (params?: { role?: string }) => api.get('/api/users', { params }),
  get: (id: number) => api.get(`/api/users/${id}`),
  create: (data: any) => api.post('/api/users', data),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
}

export const specialtyApi = {
  list: () => api.get('/api/specialties'),
  get: (id: number) => api.get(`/api/specialties/${id}`),
  create: (data: any) => api.post('/api/specialties', data),
  update: (id: number, data: any) => api.put(`/api/specialties/${id}`, data),
  delete: (id: number) => api.delete(`/api/specialties/${id}`),
}

export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
  getAppointmentTrends: (days?: number) => 
    api.get('/api/dashboard/appointment-trends', { params: { days: days || 30 } }),
  getTherapistUtilization: () => api.get('/api/dashboard/therapist-utilization'),
}