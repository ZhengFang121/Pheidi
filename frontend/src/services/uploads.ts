import api from '@/services/api'
import type { UploadAdminArticleCoverResponse } from '@/types/article'

export const uploadAdminArticleCover = async (file: File) => {
  const formData = new FormData()

  formData.append('image', file)

  const response = await api.post<UploadAdminArticleCoverResponse>(
    '/admin/uploads/article-cover',
    formData,
  )

  return response.data
}
