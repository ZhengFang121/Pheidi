import api from '@/services/api'
import type {
  CreatePostPayload,
  CreatePostResponse,
  GetPostsParams,
  PostListResponse,
  TogglePostLikeResponse,
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
