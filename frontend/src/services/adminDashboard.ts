import api from '@/services/api'
import type { AdminDashboardResponse } from '@/types/user'

export const getAdminDashboard = async () => {
  const response = await api.get<AdminDashboardResponse>('/admin/dashboard')

  return response.data
}
