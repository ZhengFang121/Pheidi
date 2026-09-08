import type { Pagination } from '@/types/api'

export interface PostAuthor {
  _id: string
  username: string
}

export interface PostImage {
  url: string
  width?: number
  height?: number
}

export interface PlazaPost {
  id: string
  content: string
  images: PostImage[]
  author: PostAuthor
  runnerLevel: string
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
  images?: Array<PostImage & { publicId: string }>
}

export interface CreatePostResponse {
  message: string
  post: PlazaPost
}

export interface UpdatePostPayload {
  content: string
  retainedImageUrls: string[]
  newImages?: Array<PostImage & { publicId: string }>
}

export interface UpdatePostResponse {
  message: string
  post: PlazaPost
}

export interface DeletePostResponse {
  message: string
}

export interface UploadedPostImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface UploadPostImageResponse {
  message: string
  image: UploadedPostImage
}

export interface UploadPostImagesResponse {
  message: string
  images: UploadedPostImage[]
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
