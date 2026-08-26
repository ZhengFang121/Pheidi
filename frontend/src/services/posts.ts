import api from '@/services/api'
import type {
  CreatePostPayload,
  CreatePostCommentPayload,
  CreatePostCommentResponse,
  CreatePostResponse,
  DeletePostCommentResponse,
  GetPostCommentsParams,
  GetPostsParams,
  PostCommentListResponse,
  PostListResponse,
  TogglePostLikeResponse,
  TogglePostCommentLikeResponse,
  UpdatePostCommentPayload,
  UpdatePostCommentResponse,
} from '@/types/post'

export const getPosts = async (params: GetPostsParams = {}) => {
  const response = await api.get<PostListResponse>('/posts', {
    params,
  })

  return response.data
}

export const createPost = async (payload: CreatePostPayload) => {
  const response = await api.post<CreatePostResponse>('/posts', payload)

  return response.data
}

export const togglePostLike = async (postId: string) => {
  const response = await api.patch<TogglePostLikeResponse>(`/posts/${postId}/like`)

  return response.data
}

export const getPostComments = async (postId: string, params: GetPostCommentsParams = {}) => {
  const response = await api.get<PostCommentListResponse>(`/posts/${postId}/comments`, {
    params,
  })

  return response.data
}

export const createPostComment = async (postId: string, payload: CreatePostCommentPayload) => {
  const response = await api.post<CreatePostCommentResponse>(`/posts/${postId}/comments`, payload)

  return response.data
}

export const togglePostCommentLike = async (postId: string, commentId: string) => {
  const response = await api.patch<TogglePostCommentLikeResponse>(
    `/posts/${postId}/comments/${commentId}/like`,
  )

  return response.data
}

export const updatePostComment = async (
  postId: string,
  commentId: string,
  payload: UpdatePostCommentPayload,
) => {
  const response = await api.patch<UpdatePostCommentResponse>(
    `/posts/${postId}/comments/${commentId}`,
    payload,
  )

  return response.data
}

export const deletePostComment = async (postId: string, commentId: string) => {
  const response = await api.delete<DeletePostCommentResponse>(
    `/posts/${postId}/comments/${commentId}`,
  )

  return response.data
}
