import type { Pagination } from '@/types/api'

export type AdminPlazaSort = 'newest' | 'oldest'

export interface AdminPlazaStatistics {
  totalPosts: number
  totalComments: number
  postsWithImages: number
  totalPostLikes: number
  totalCommentLikes: number
}

export interface AdminPlazaStatisticsResponse {
  message: string
  statistics: AdminPlazaStatistics
}

export interface AdminPlazaAuthor {
  id: string
  username: string
}

export interface AdminPlazaPost {
  id: string
  content: string
  imageUrl?: string
  author: AdminPlazaAuthor
  likeCount: number
  commentCount: number
  createdAt: string
}

export interface AdminPlazaComment {
  id: string
  content: string
  author: AdminPlazaAuthor
  postId: string
  postExcerpt: string
  likeCount: number
  createdAt: string
}

export interface GetAdminPlazaPostsParams {
  page?: number
  limit?: number
  search?: string
  hasImage?: boolean
  sort?: AdminPlazaSort
}

export interface GetAdminPlazaCommentsParams {
  page?: number
  limit?: number
  search?: string
  sort?: AdminPlazaSort
}

export interface AdminPlazaPostListResponse {
  message: string
  items: AdminPlazaPost[]
  pagination: Pagination
}

export interface AdminPlazaCommentListResponse {
  message: string
  items: AdminPlazaComment[]
  pagination: Pagination
}

export interface DeleteAdminPlazaContentResponse {
  message: string
}
