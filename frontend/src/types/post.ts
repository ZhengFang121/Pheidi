import type { Pagination } from '@/types/api'

export interface PostAuthor {
  _id: string
  username: string
}

export interface PlazaPost {
  id: string
  content: string
  imageUrl?: string
  author: PostAuthor
  likeCount: number
  isLiked: boolean
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface GetPostsParams {
  page?: number
  limit?: number
}

export interface PostListResponse {
  message: string
  posts: PlazaPost[]
  pagination: Pagination
}

export interface CreatePostPayload {
  content: string
  imageUrl?: string
}

export interface CreatePostResponse {
  message: string
  post: PlazaPost
}

export interface TogglePostLikeResponse {
  message: string
  likeCount: number
  isLiked: boolean
}
