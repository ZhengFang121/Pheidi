import api from '@/services/api'
import type { ArticleDetailResponse, ArticleListResponse, GetArticlesParams } from '@/types/article'

export const getArticles = async (params: GetArticlesParams = {}) => {
  const response = await api.get<ArticleListResponse>('/articles', {
    params,
  })

  return response.data
}

export const getArticleBySlug = async (slug: string) => {
  const response = await api.get<ArticleDetailResponse>(`/articles/${slug}`)

  return response.data
}
