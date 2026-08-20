import type { ArticleCategory, ArticleStatus } from '@/types/article'

export interface ArticleCategoryOption {
  label: string
  value: ArticleCategory
}

export interface ArticleStatusOption {
  label: string
  value: ArticleStatus
}

export const articleCategoryLabels: Record<ArticleCategory, string> = {
  learning: '學習',
  equipment: '裝備',
  nutrition: '補給',
  events: '賽事',
}

export const articleCategoryOptions: ArticleCategoryOption[] = [
  { label: articleCategoryLabels.learning, value: 'learning' },
  { label: articleCategoryLabels.equipment, value: 'equipment' },
  { label: articleCategoryLabels.nutrition, value: 'nutrition' },
  { label: articleCategoryLabels.events, value: 'events' },
]

export const articleStatusLabels: Record<ArticleStatus, string> = {
  draft: '草稿',
  published: '已發布',
}

export const articleStatusOptions: ArticleStatusOption[] = [
  { label: articleStatusLabels.draft, value: 'draft' },
  { label: articleStatusLabels.published, value: 'published' },
]

export const getArticleCategoryLabel = (category: ArticleCategory) => {
  return articleCategoryLabels[category]
}

export const getArticleStatusLabel = (status: ArticleStatus) => {
  return articleStatusLabels[status]
}
