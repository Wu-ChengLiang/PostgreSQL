export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: 'admin' | 'therapist' | 'patient'
  createdAt: string
  updatedAt: string
}

export interface Store {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email?: string
  operatingHours: OperatingHours
  createdAt: string
  updatedAt: string
}

export interface OperatingHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export interface Specialty {
  id: number
  name: string
  description?: string
  duration: number // in minutes
  price: number
  createdAt: string
  updatedAt: string
}

export interface Therapist {
  id: number
  userId: number
  storeId: number
  user?: User
  store?: Store
  specialties?: Specialty[]
  bio?: string
  yearsExperience: number
  rating?: number
  totalAppointments?: number
  createdAt: string
  updatedAt: string
}

export interface TherapistSchedule {
  id: number
  therapistId: number
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string
  endTime: string
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: number
  userId: number
  therapistId: number
  storeId: number
  specialtyId: number
  user?: User
  therapist?: Therapist
  store?: Store
  specialty?: Specialty
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  totalPrice: number
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalUsers: number
  totalTherapists: number
  totalAppointments: number
  totalStores: number
  todayAppointments: number
  weekRevenue: number
  monthRevenue: number
  averageRating: number
}

export interface AppointmentTrend {
  date: string
  count: number
  revenue: number
}

export interface TherapistUtilization {
  therapistId: number
  therapistName: string
  storeName: string
  totalSlots: number
  bookedSlots: number
  utilizationRate: number
  revenue: number
}