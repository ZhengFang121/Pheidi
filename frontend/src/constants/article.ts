import type { ArticleCategory, ArticleStatus } from '@/types/article'
import type { RunnerLevel } from '@/types/runnerProgress'

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

export const academyCategoryUnlockLevels = {
  learning: 1,
  equipment: 3,
  nutrition: 4,
  events: 5,
} as const satisfies Record<ArticleCategory, RunnerLevel>

const academyCategoryUnlockIdentities: Record<ArticleCategory, string> = {
  learning: '啟程者',
  equipment: '冒險者',
  nutrition: '挑戰者',
  events: '菲迪同行者',
}

export const getMinimumLevelForAcademyCategory = (category: ArticleCategory): RunnerLevel => {
  return academyCategoryUnlockLevels[category]
}

export const canAccessAcademyCategory = (level: RunnerLevel, category: ArticleCategory) => {
  return level >= getMinimumLevelForAcademyCategory(category)
}

export const getUnlockedAcademyCategories = (level: RunnerLevel): ArticleCategory[] => {
  return articleCategoryOptions
    .map(({ value }) => value)
    .filter((category) => canAccessAcademyCategory(level, category))
}

export const getAcademyCategoryUnlockDetail = (category: ArticleCategory) => {
  const requiredLevel = getMinimumLevelForAcademyCategory(category)

  return `成為${academyCategoryUnlockIdentities[category]} Lv.${requiredLevel} 後，即可閱讀${articleCategoryLabels[category]}相關內容。`
}

export const isArticleCategory = (value: unknown): value is ArticleCategory => {
  return articleCategoryOptions.some(({ value: category }) => category === value)
}

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
