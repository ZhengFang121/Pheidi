import api from '@/services/api'

export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'player' | 'admin'
  createdAt: string
  updatedAt: string
}

export type AdminArticleCategory =
  | 'learning'
  | 'equipment'
  | 'nutrition'
  | 'events'

export type AdminArticleStatus = 'draft' | 'published'

export interface AdminArticleAuthor {
  _id: string
  username: string
  email: string
}

export interface AdminArticle {
  id: string
  title: string
  slug: string
  summary: string
  category: AdminArticleCategory
  coverImageUrl?: string
  status: AdminArticleStatus
  author: AdminArticleAuthor
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AdminArticlePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminArticleListResponse {
  message: string
  articles: AdminArticle[]
  pagination: AdminArticlePagination
}

export interface GetAdminArticlesParams {
  page?: number
  limit?: number
  search?: string
  category?: AdminArticleCategory
  status?: AdminArticleStatus
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

export interface UpdateAdminUserRoleResponse {
  message: string
  user: AdminUser
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

export const updateAdminUserRole = async (
  userId: string,
  role: AdminUser['role'],
) => {
  const response = await api.patch<UpdateAdminUserRoleResponse>(
    `/admin/users/${userId}/role`,
    {
      role,
    },
  )

  return response.data
}

export const getAdminArticles = async (
  params: GetAdminArticlesParams = {},
) => {
  const response = await api.get<AdminArticleListResponse>(
    '/admin/articles',
    {
      params,
    },
  )

  return response.data
}