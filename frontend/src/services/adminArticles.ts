import api from '@/services/api'
import type {
  AdminArticleFormPayload,
  AdminArticleListResponse,
  AdminArticleResponse,
  AdminArticleStatisticsResponse,
  DeleteAdminArticleResponse,
  GetAdminArticlesParams,
  ArticleStatus,
} from '@/types/article'

export const getAdminArticleStatistics = async () => {
  const response = await api.get<AdminArticleStatisticsResponse>('/admin/articles/statistics')

  return response.data
}

export const getAdminArticles = async (params: GetAdminArticlesParams = {}) => {
  const response = await api.get<AdminArticleListResponse>('/admin/articles', {
    params,
  })

  return response.data
}

export const getAdminArticle = async (articleId: string) => {
  const response = await api.get<AdminArticleResponse>(`/admin/articles/${articleId}`)

  return response.data
}

export const createAdminArticle = async (payload: AdminArticleFormPayload) => {
  const response = await api.post<AdminArticleResponse>('/admin/articles', payload)

  return response.data
}

export const updateAdminArticle = async (articleId: string, payload: AdminArticleFormPayload) => {
  const response = await api.patch<AdminArticleResponse>(`/admin/articles/${articleId}`, payload)

  return response.data
}

export const deleteAdminArticle = async (articleId: string) => {
  const response = await api.delete<DeleteAdminArticleResponse>(`/admin/articles/${articleId}`)

  return response.data
}

export const updateAdminArticleStatus = async (articleId: string, status: ArticleStatus) => {
  const response = await api.patch<AdminArticleResponse>(`/admin/articles/${articleId}/status`, {
    status,
  })

  return response.data
}
