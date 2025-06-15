'use client'

import React, { useState, useEffect } from 'react'
import { DataTable, Column } from '@/components/tables/DataTable'
import { userApi } from '@/lib/api'
import { User } from '@/types/appointment'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User as UserIcon, Mail, Phone, Shield, Plus, X, Save } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('')
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'patient' as User['role'],
    password: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userApi.list(roleFilter ? { role: roleFilter } : undefined)
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSend = { ...formData }
      // Don't send password when editing unless it's changed
      if (editingUser && !formData.password) {
        delete (dataToSend as any).password
      }
      
      if (editingUser) {
        await userApi.update(editingUser.id, dataToSend)
      } else {
        await userApi.create(dataToSend)
      }
      setShowForm(false)
      setEditingUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Failed to save user:', error)
      alert('Failed to save user. Please try again.')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '', // Don't populate password when editing
    })
    setShowForm(true)
  }

  const handleDelete = async (user: User) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userApi.delete(user.id)
        fetchUsers()
      } catch (error) {
        console.error('Failed to delete user:', error)
        alert('Failed to delete user. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'patient',
      password: '',
    })
  }

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'therapist':
        return 'bg-blue-100 text-blue-800'
      case 'patient':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'name',
      header: 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'email',
      header: 'Contact',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{value}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(value)}`}>
            {value}
          </span>
        </div>
      ),
      filterable: true,
    },
    {
      key: 'createdAt',
      header: 'Member Since',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-2">Manage system users and their access</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="roleFilter" className="text-sm font-medium text-gray-700">
            Filter by role:
          </label>
          <select
            id="roleFilter"
            className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="therapist">Therapist</option>
            <option value="patient">Patient</option>
          </select>
        </div>
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingUser ? 'Edit User' : 'New User'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setEditingUser(null)
                resetForm()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="therapist">Therapist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Enter new password to change' : 'Enter password'}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Role Permissions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {formData.role === 'admin' && (
                  <>
                    <li>• Full system access</li>
                    <li>• Manage all users, stores, and appointments</li>
                    <li>• View all reports and analytics</li>
                  </>
                )}
                {formData.role === 'therapist' && (
                  <>
                    <li>• View and manage own appointments</li>
                    <li>• Update own profile and schedules</li>
                    <li>• View patient information for appointments</li>
                  </>
                )}
                {formData.role === 'patient' && (
                  <>
                    <li>• Book and manage own appointments</li>
                    <li>• View therapist profiles</li>
                    <li>• Update own profile information</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingUser(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-1" />
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        onAdd={() => setShowForm(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pageSize={20}
      />
    </div>
  )
}