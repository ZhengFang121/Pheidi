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

export interface PostComment {
  id: string
  content: string
  author: PostAuthor
  likeCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}

export interface GetPostCommentsParams {
  page?: number
  limit?: number
}

export interface PostCommentListResponse {
  message: string
  comments: PostComment[]
  pagination: Pagination
}

export interface CreatePostCommentPayload {
  content: string
}

export interface CreatePostCommentResponse {
  message: string
  comment: PostComment
  commentCount: number
}

export interface TogglePostCommentLikeResponse {
  message: string
  likeCount: number
  isLiked: boolean
}

export interface UpdatePostCommentPayload {
  content: string
}

export interface UpdatePostCommentResponse {
  message: string
  comment: PostComment
}

export interface DeletePostCommentResponse {
  message: string
  commentCount: number
}
