import type { Pagination } from '@/types/api'

export type UserRole = 'player' | 'admin'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
}

export interface AdminUser extends AuthUser {
  createdAt: string
  updatedAt: string
}

export interface AdminDashboardStatistics {
  totalUsers: number
  totalPlayers: number
  totalAdmins: number
  newUsersLastSevenDays: number
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalPosts: number
  totalComments: number
}

export interface AdminUserStatistics {
  totalUsers: number
  totalPlayers: number
  totalAdmins: number
  newUsersLastSevenDays: number
}

export interface AdminUserStatisticsResponse {
  message: string
  statistics: AdminUserStatistics
}

export interface AdminLatestUser extends AuthUser {
  createdAt: string
}

export interface AdminDashboardResponse {
  message: string
  statistics: AdminDashboardStatistics
  latestUsers: AdminLatestUser[]
}

export interface AdminUserListResponse {
  message: string
  users: AdminUser[]
  pagination: Pagination
}

export interface GetAdminUsersParams {
  page?: number
  limit?: number
  search?: string
}

export interface UpdateAdminUserRoleResponse {
  message: string
  user: AdminUser
}
