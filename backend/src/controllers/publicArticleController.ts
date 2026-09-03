import type { Router } from 'express'

import {
  canAccessAcademyCategory,
  getMinimumLevelForAcademyCategory,
  getUnlockedAcademyCategories,
} from '../constants/academyAccess.js'
import Article, { ARTICLE_CATEGORIES, type ArticleCategory } from '../models/Article.js'
import { ensureRunnerProgress } from '../services/runnerProgressService.js'
import { parsePositiveInteger } from '../utils/query.js'
import { escapeRegularExpression } from '../utils/regex.js'

export const registerPublicArticleHandlers = (router: Router) => {
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const defaultPage = 1
const defaultLimit = 12
const maximumLimit = 50

type ArticleSearchCondition = {
  $regex: string
  $options: 'i'
}

type PublicArticleListFilter = {
  status: 'published'
  category?: ArticleCategory | { $in: ArticleCategory[] }
  $or?: Array<{
    title?: ArticleSearchCondition
    summary?: ArticleSearchCondition
  }>
}

const isArticleCategory = (value: unknown): value is ArticleCategory => {
  return typeof value === 'string' && ARTICLE_CATEGORIES.some((category) => category === value)
}

// 文章列表
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: '請先登入',
      })
      return
    }

    const page = parsePositiveInteger(req.query.page, defaultPage)

    const requestedLimit = parsePositiveInteger(req.query.limit, defaultLimit)

    const limit = Math.min(requestedLimit, maximumLimit)

    const skip = (page - 1) * limit

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

    const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''

    if (category && !isArticleCategory(category)) {
      res.status(400).json({
        message: '文章分類篩選條件不正確',
      })
      return
    }

    const progression = await ensureRunnerProgress(req.user.userId)
    const currentLevel = progression.currentLevel

    if (isArticleCategory(category) && !canAccessAcademyCategory(currentLevel, category)) {
      res.status(403).json({
        message: '此跑者學院內容尚未解鎖',
        requiredLevel: getMinimumLevelForAcademyCategory(category),
        category,
      })
      return
    }

    const filter: PublicArticleListFilter = {
      status: 'published',
    }

    if (search) {
      const escapedSearch = escapeRegularExpression(search)

      filter.$or = [
        {
          title: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
        {
          summary: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
      ]
    }

    filter.category = isArticleCategory(category)
      ? category
      : { $in: getUnlockedAcademyCategories(currentLevel) }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .select('_id title slug summary category coverImageUrl author publishedAt')
        .populate('author', 'username')
        .sort({
          publishedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ])

    res.status(200).json({
      message: '取得跑者學院文章成功',
      articles: articles.map((article) => ({
        id: article._id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        category: article.category,
        coverImageUrl: article.coverImageUrl,
        author: article.author,
        publishedAt: article.publishedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error('Failed to get published article list:', error)

    res.status(500).json({
      message: '取得跑者學院文章失敗',
    })
  }
})

// 單篇文章
router.get('/:slug', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: '請先登入',
      })
      return
    }

    const { slug } = req.params

    if (!slug || !slugPattern.test(slug)) {
      res.status(400).json({
        message: '文章網址識別格式不正確',
      })
      return
    }

    const article = await Article.findOne({
      slug,
      status: 'published',
    })
      .select(
        '_id title slug summary content category coverImageUrl author publishedAt',
      )
      .populate('author', 'username')
      .lean()

    if (!article) {
      res.status(404).json({
        message: '找不到指定的文章',
      })
      return
    }

    const progression = await ensureRunnerProgress(req.user.userId)

    if (!canAccessAcademyCategory(progression.currentLevel, article.category)) {
      res.status(403).json({
        message: '此跑者學院內容尚未解鎖',
        requiredLevel: getMinimumLevelForAcademyCategory(article.category),
        category: article.category,
      })
      return
    }

    res.status(200).json({
      message: '取得跑者學院文章成功',
      article: {
        id: article._id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        category: article.category,
        coverImageUrl: article.coverImageUrl,
        author: article.author,
        publishedAt: article.publishedAt,
      },
    })
  } catch (error: unknown) {
    console.error(
      'Failed to get published article:',
      error,
    )

    res.status(500).json({
      message: '取得跑者學院文章失敗',
    })
  }
})

}
