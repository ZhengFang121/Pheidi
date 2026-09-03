import type { RunnerLevel } from './runnerLevels.js'
import type { ArticleCategory } from '../models/Article.js'

export const ACADEMY_CATEGORY_UNLOCK_LEVELS = {
  learning: 1,
  equipment: 3,
  nutrition: 4,
  events: 5,
} as const satisfies Record<ArticleCategory, RunnerLevel>

export const getMinimumLevelForAcademyCategory = (category: ArticleCategory): RunnerLevel => {
  return ACADEMY_CATEGORY_UNLOCK_LEVELS[category]
}

export const canAccessAcademyCategory = (level: RunnerLevel, category: ArticleCategory) => {
  return level >= getMinimumLevelForAcademyCategory(category)
}

export const getUnlockedAcademyCategories = (level: RunnerLevel): ArticleCategory[] => {
  return (Object.keys(ACADEMY_CATEGORY_UNLOCK_LEVELS) as ArticleCategory[]).filter((category) =>
    canAccessAcademyCategory(level, category),
  )
}
