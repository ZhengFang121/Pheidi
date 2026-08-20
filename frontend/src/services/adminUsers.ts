import api from '@/services/api'
import type {
  AdminUser,
  AdminUserListResponse,
  GetAdminUsersParams,
  UpdateAdminUserRoleResponse,
} from '@/types/user'

export const getAdminUsers = async (params: GetAdminUsersParams = {}) => {
  const response = await api.get<AdminUserListResponse>('/admin/users', {
    params,
  })

  return response.data
}

export const updateAdminUserRole = async (userId: string, role: AdminUser['role']) => {
  const response = await api.patch<UpdateAdminUserRoleResponse>(`/admin/users/${userId}/role`, {
    role,
  })

  return response.data
}
