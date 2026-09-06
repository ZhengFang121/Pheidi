import type { ArticleCategory } from '../../models/Article.js'

export interface AcademyArticleSeed {
  title: string
  slug: string
  summary: string
  content: string
  category: ArticleCategory
}
