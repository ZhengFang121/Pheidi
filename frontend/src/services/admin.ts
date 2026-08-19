import api from '@/services/api'

export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'player' | 'admin'
  createdAt: string
  updatedAt: string
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