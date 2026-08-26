import api from '@/services/api'
import type { UploadAdminArticleCoverResponse } from '@/types/article'
import type { UploadPostImageResponse } from '@/types/post'

const createImageFormData = (file: File) => {
  const formData = new FormData()

  formData.append('image', file)

  return formData
}

export const uploadAdminArticleCover = async (file: File) => {
  const response = await api.post<UploadAdminArticleCoverResponse>(
    '/admin/uploads/article-cover',
    createImageFormData(file),
  )

  return response.data
}

export const uploadPostImage = async (file: File) => {
  const response = await api.post<UploadPostImageResponse>(
    '/uploads/post-image',
    createImageFormData(file),
  )

  return response.data
}
