import api from '@/services/api'
import type { AdminDashboardPeriodKey, AdminDashboardResponse } from '@/types/user'

export const getAdminDashboard = async (period: AdminDashboardPeriodKey = 'recent-30-days') => {
  const response = await api.get<AdminDashboardResponse>('/admin/dashboard', {
    params: { period },
  })

  return response.data
}
