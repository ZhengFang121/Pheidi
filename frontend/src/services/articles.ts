import api from '@/services/api'

export type ArticleCategory =
  | 'learning'
  | 'equipment'
  | 'nutrition'
  | 'events'

export interface ArticleAuthor {
  _id: string
  username: string
}

export interface ArticleListItem {
  id: string
  title: string
  slug: string
  summary: string
  category: ArticleCategory
  coverImageUrl?: string
  author: ArticleAuthor
  publishedAt: string
}

export interface ArticleDetail
  extends ArticleListItem {
  content: string
}

export interface ArticlePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ArticleListResponse {
  message: string
  articles: ArticleListItem[]
  pagination: ArticlePagination
}

export interface ArticleDetailResponse {
  message: string
  article: ArticleDetail
}

export interface GetArticlesParams {
  page?: number
  limit?: number
  search?: string
  category?: ArticleCategory
}

export const getArticles = async (
  params: GetArticlesParams = {},
) => {
  const response = await api.get<ArticleListResponse>(
    '/articles',
    {
      params,
    },
  )

  return response.data
}

export const getArticleBySlug = async (
  slug: string,
) => {
  const response =
    await api.get<ArticleDetailResponse>(
      `/articles/${slug}`,
    )

  return response.data
}