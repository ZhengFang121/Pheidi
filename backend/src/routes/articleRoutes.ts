import { Router } from 'express'
import sanitizeHtml from 'sanitize-html'

import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'
import Article, {
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES,
  type ArticleCategory,
  type ArticleStatus,
} from '../models/Article.js'

const router = Router()

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const defaultPage = 1
const defaultLimit = 10
const maximumLimit = 50

type ArticleSearchCondition = {
  $regex: string
  $options: 'i'
}

type ArticleListFilter = {
  $or?: Array<{
    title?: ArticleSearchCondition
    slug?: ArticleSearchCondition
    summary?: ArticleSearchCondition
  }>
  category?: ArticleCategory
  status?: ArticleStatus
}

const parsePositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value !== 'string') return fallback

  const parsedValue = Number.parseInt(value, 10)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

const escapeRegularExpression = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const isArticleCategory = (value: unknown): value is ArticleCategory => {
  return typeof value === 'string' && ARTICLE_CATEGORIES.some((category) => category === value)
}

const isArticleStatus = (value: unknown): value is ArticleStatus => {
  return typeof value === 'string' && ARTICLE_STATUSES.some((status) => status === value)
}

const isValidImageUrl = (value: string) => {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const sanitizeArticleContent = (content: string) => {
  return sanitizeHtml(content, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'h1',
      'h2',
      'h3',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: 'a',
        attribs: {
          ...attributes,
          rel: 'noopener noreferrer',
        },
      }),
    },
  })
}

const hasDuplicateKeyError = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000
}

/*
 * 所有 /api/admin/articles 路由都必須先通過登入與管理員驗證。
 */
router.use(authenticateToken, requireAdmin)

router.get('/', async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, defaultPage)
    const requestedLimit = parsePositiveInteger(req.query.limit, defaultLimit)
    const limit = Math.min(requestedLimit, maximumLimit)
    const skip = (page - 1) * limit

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

    const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''

    const status = typeof req.query.status === 'string' ? req.query.status.trim() : ''

    if (category && !isArticleCategory(category)) {
      res.status(400).json({
        message: '文章分類篩選條件不正確',
      })
      return
    }

    if (status && !isArticleStatus(status)) {
      res.status(400).json({
        message: '文章狀態篩選條件不正確',
      })
      return
    }

    const filter: ArticleListFilter = {}

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
          slug: {
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

    if (isArticleCategory(category)) {
      filter.category = category
    }

    if (isArticleStatus(status)) {
      filter.status = status
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .select(
          '_id title slug summary category coverImageUrl status author publishedAt createdAt updatedAt',
        )
        .populate('author', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ])

    res.status(200).json({
      message: '取得文章列表成功',
      articles: articles.map((article) => ({
        id: article._id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        category: article.category,
        coverImageUrl: article.coverImageUrl,
        status: article.status,
        author: article.author,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error('Failed to get article list:', error)

    res.status(500).json({
      message: '取得文章列表失敗',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: '請先登入',
      })
      return
    }

    const { title, slug, summary, content, category, coverImageUrl } = req.body ?? {}

    if (typeof title !== 'string' || title.trim().length < 2) {
      res.status(400).json({
        message: '文章標題至少需要 2 個字元',
      })
      return
    }

    if (title.trim().length > 100) {
      res.status(400).json({
        message: '文章標題不能超過 100 個字元',
      })
      return
    }

    if (typeof slug !== 'string' || !slugPattern.test(slug.trim().toLowerCase())) {
      res.status(400).json({
        message: '網址識別只能包含小寫英文字母、數字與連字號',
      })
      return
    }

    if (slug.trim().length > 120) {
      res.status(400).json({
        message: '網址識別不能超過 120 個字元',
      })
      return
    }

    if (typeof summary !== 'string' || !summary.trim()) {
      res.status(400).json({
        message: '請填寫文章摘要',
      })
      return
    }

    if (summary.trim().length > 300) {
      res.status(400).json({
        message: '文章摘要不能超過 300 個字元',
      })
      return
    }

    if (typeof content !== 'string' || !content.trim()) {
      res.status(400).json({
        message: '請填寫文章內容',
      })
      return
    }

    if (!isArticleCategory(category)) {
      res.status(400).json({
        message: '文章分類不正確',
      })
      return
    }

    const normalizedCoverImageUrl = typeof coverImageUrl === 'string' ? coverImageUrl.trim() : ''

    if (normalizedCoverImageUrl && !isValidImageUrl(normalizedCoverImageUrl)) {
      res.status(400).json({
        message: '封面圖片網址格式不正確',
      })
      return
    }

    const sanitizedContent = sanitizeArticleContent(content)

    if (!sanitizeHtml(sanitizedContent, { allowedTags: [] }).trim()) {
      res.status(400).json({
        message: '文章內容不能只有空白或 HTML 標籤',
      })
      return
    }

    const article = await Article.create({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      summary: summary.trim(),
      content: sanitizedContent,
      category,
      ...(normalizedCoverImageUrl
        ? {
            coverImageUrl: normalizedCoverImageUrl,
          }
        : {}),
      status: 'draft',
      author: req.user.userId,
    })

    res.status(201).json({
      message: '文章草稿建立成功',
      article: {
        id: article._id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        category: article.category,
        coverImageUrl: article.coverImageUrl,
        status: article.status,
        author: article.author,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
    })
  } catch (error: unknown) {
    if (hasDuplicateKeyError(error)) {
      res.status(409).json({
        message: '這個網址識別已經被其他文章使用',
      })
      return
    }

    console.error('Failed to create article:', error)

    res.status(500).json({
      message: '建立文章失敗',
    })
  }
})

export default router
