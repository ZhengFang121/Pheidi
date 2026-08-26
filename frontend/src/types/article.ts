import type { Pagination } from '@/types/api'

export type ArticleCategory = 'learning' | 'equipment' | 'nutrition' | 'events'

export type ArticleStatus = 'draft' | 'published'

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

export interface ArticleDetail extends ArticleListItem {
  content: string
}

export interface ArticleListResponse {
  message: string
  articles: ArticleListItem[]
  pagination: Pagination
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

export interface AdminArticleAuthor extends ArticleAuthor {
  email: string
}

export interface AdminArticle {
  id: string
  title: string
  slug: string
  summary: string
  category: ArticleCategory
  coverImageUrl?: string
  status: ArticleStatus
  author: AdminArticleAuthor
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AdminArticleDetail extends AdminArticle {
  content: string
}

export interface AdminArticleFormPayload {
  title: string
  slug: string
  summary: string
  content: string
  category: ArticleCategory
  coverImageUrl: string
}

export interface AdminArticleResponse {
  message: string
  article: AdminArticleDetail
}

export interface AdminArticleCoverImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface UploadAdminArticleCoverResponse {
  message: string
  image: AdminArticleCoverImage
}

export interface DeleteAdminArticleResponse {
  message: string
}

export interface AdminArticleListResponse {
  message: string
  articles: AdminArticle[]
  pagination: Pagination
}

export interface AdminArticleStatistics {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  articlesWithCover: number
}

export interface AdminArticleStatisticsResponse {
  message: string
  statistics: AdminArticleStatistics
}

export interface GetAdminArticlesParams {
  page?: number
  limit?: number
  search?: string
  category?: ArticleCategory
  status?: ArticleStatus
}
