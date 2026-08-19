import api from '@/services/api'

export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'player' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface AdminDashboardStatistics {
  totalUsers: number
  totalPlayers: number
  totalAdmins: number
  newUsersLastSevenDays: number
}

export interface AdminLatestUser {
  id: string
  username: string
  email: string
  role: 'player' | 'admin'
  createdAt: string
}

export interface AdminDashboardResponse {
  message: string
  statistics: AdminDashboardStatistics
  latestUsers: AdminLatestUser[]
}

export interface AdminUserPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminUserListResponse {
  message: string
  users: AdminUser[]
  pagination: AdminUserPagination
}

export interface GetAdminUsersParams {
  page?: number
  limit?: number
  search?: string
}

export const getAdminUsers = async (params: GetAdminUsersParams = {}) => {
  const response = await api.get<AdminUserListResponse>('/admin/users', {
    params,
  })

  return response.data
}

export const getAdminDashboard = async () => {
  const response = await api.get<AdminDashboardResponse>('/admin/dashboard')

  return response.data
}
