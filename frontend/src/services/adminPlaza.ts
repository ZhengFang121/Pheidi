import api from '@/services/api'
import type {
  AdminPlazaCommentListResponse,
  AdminPlazaPostListResponse,
  AdminPlazaStatisticsResponse,
  DeleteAdminPlazaContentResponse,
  GetAdminPlazaCommentsParams,
  GetAdminPlazaPostsParams,
} from '@/types/adminPlaza'

export const getAdminPlazaStatistics = async () => {
  const response = await api.get<AdminPlazaStatisticsResponse>('/admin/plaza/statistics')

  return response.data
}

export const getAdminPlazaPosts = async (params: GetAdminPlazaPostsParams = {}) => {
  const response = await api.get<AdminPlazaPostListResponse>('/admin/plaza/posts', {
    params,
  })

  return response.data
}

export const getAdminPlazaComments = async (params: GetAdminPlazaCommentsParams = {}) => {
  const response = await api.get<AdminPlazaCommentListResponse>('/admin/plaza/comments', {
    params,
  })

  return response.data
}

export const deleteAdminPlazaPost = async (postId: string) => {
  const response = await api.delete<DeleteAdminPlazaContentResponse>(`/admin/plaza/posts/${postId}`)

  return response.data
}

export const deleteAdminPlazaComment = async (commentId: string) => {
  const response = await api.delete<DeleteAdminPlazaContentResponse>(
    `/admin/plaza/comments/${commentId}`,
  )

  return response.data
}
