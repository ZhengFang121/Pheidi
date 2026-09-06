import 'dotenv/config'

import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import mongoose from 'mongoose'
import sanitizeHtml from 'sanitize-html'

import { connectDatabase } from '../configs/database.js'
import { sanitizeArticleContent } from '../controllers/articleController.js'
import { academyArticles } from '../data/academyArticles/index.js'
import Article, { ARTICLE_CATEGORIES, type ArticleCategory } from '../models/Article.js'
import User from '../models/User.js'

const expectedCategoryCounts: Record<ArticleCategory, number> = {
  learning: 9,
  equipment: 6,
  nutrition: 6,
  events: 6,
}

const coverRoot = fileURLToPath(new URL('../../assets/academy-covers/', import.meta.url))
const cloudinaryFolderRoot = 'pheidi/articles/academy'
const validateOnly = process.argv.includes('--validate-only')

const getVisibleCharacterCount = (content: string) => {
  return sanitizeHtml(content, { allowedTags: [] }).replace(/\s/g, '').length
}

const validateSeedData = async () => {
  const errors: string[] = []
  const seenSlugs = new Set<string>()
  const seenTitles = new Set<string>()
  const categoryCounts = Object.fromEntries(
    ARTICLE_CATEGORIES.map((category) => [category, 0]),
  ) as Record<ArticleCategory, number>

  if (academyArticles.length !== 27) {
    errors.push(`文章總數應為 27，目前為 ${academyArticles.length}`)
  }

  for (const article of academyArticles) {
    if (seenSlugs.has(article.slug)) errors.push(`slug 重複：${article.slug}`)
    if (seenTitles.has(article.title)) errors.push(`標題重複：${article.title}`)

    seenSlugs.add(article.slug)
    seenTitles.add(article.title)
    categoryCounts[article.category] += 1

    if (article.summary.length < 40 || article.summary.length > 80) {
      errors.push(`${article.slug} 摘要需為 40～80 字，目前為 ${article.summary.length} 字`)
    }

    const content = article.content.trim()
    const characterCount = getVisibleCharacterCount(content)

    if (characterCount < 800 || characterCount > 1500) {
      errors.push(`${article.slug} 內文需為 800～1500 字，目前為 ${characterCount} 字`)
    }

    if (sanitizeArticleContent(content) !== content) {
      errors.push(`${article.slug} 內文包含 sanitizer 會修改的 HTML`)
    }

    const coverPath = path.join(coverRoot, article.category, `${article.slug}.jpg`)

    try {
      await access(coverPath)
    } catch {
      errors.push(`${article.slug} 找不到封面：${coverPath}`)
    }
  }

  for (const category of ARTICLE_CATEGORIES) {
    if (categoryCounts[category] !== expectedCategoryCounts[category]) {
      errors.push(
        `${category} 應有 ${expectedCategoryCounts[category]} 篇，目前為 ${categoryCounts[category]} 篇`,
      )
    }
  }

  if (errors.length) {
    throw new Error(`跑者學院 seed 資料驗證失敗：\n- ${errors.join('\n- ')}`)
  }

  console.log('Seed data validation passed:', {
    total: academyArticles.length,
    categories: categoryCounts,
    covers: academyArticles.length,
  })
}

const findAuthorId = async () => {
  const requestedEmail = process.env.ACADEMY_AUTHOR_EMAIL?.trim().toLowerCase()

  if (requestedEmail) {
    const author = await User.findOne({ email: requestedEmail, role: 'admin' }).select('_id').lean()

    if (!author) {
      throw new Error('找不到 ACADEMY_AUTHOR_EMAIL 指定的管理員帳號')
    }

    return author._id
  }

  const admins = await User.find({ role: 'admin' }).select('_id').limit(2).lean()
  const [author] = admins

  if (admins.length !== 1 || !author) {
    throw new Error(
      admins.length === 0
        ? '找不到管理員帳號，請先建立管理員或設定 ACADEMY_AUTHOR_EMAIL'
        : '目前有多位管理員，請設定 ACADEMY_AUTHOR_EMAIL 指定文章作者',
    )
  }

  return author._id
}

const isCloudinaryNotFoundError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return false

  if ('http_code' in error && error.http_code === 404) return true

  if ('error' in error && typeof error.error === 'object' && error.error !== null) {
    return 'http_code' in error.error && error.error.http_code === 404
  }

  return false
}

const getSafeErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') return error.message

    if (
      'error' in error &&
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message
    }
  }

  return '跑者學院 seed 執行失敗，外部服務未提供安全錯誤訊息'
}

const prepareCoverImages = async () => {
  const { default: cloudinary } = await import('../configs/cloudinary.js')
  const coverUrls = new Map<string, string>()

  for (const article of academyArticles) {
    const publicId = `${cloudinaryFolderRoot}/${article.category}/${article.slug}`
    const coverPath = path.join(coverRoot, article.category, `${article.slug}.jpg`)
    let reused = false

    try {
      await cloudinary.api.resource(publicId, { resource_type: 'image' })
      reused = true
    } catch (error: unknown) {
      if (!isCloudinaryNotFoundError(error)) throw error

      await cloudinary.uploader.upload(coverPath, {
        public_id: publicId,
        resource_type: 'image',
        unique_filename: false,
        overwrite: false,
        transformation: [
          {
            width: 1600,
            height: 900,
            crop: 'limit',
            quality: 'auto',
          },
        ],
      })
    }

    const url = cloudinary.url(publicId, {
      secure: true,
      transformation: [{ fetch_format: 'auto', quality: 'auto' }],
    })

    if (!url) throw new Error(`${article.slug} 無法建立 Cloudinary 圖片網址`)

    coverUrls.set(article.slug, url)
    console.log(`${reused ? 'Reused' : 'Uploaded'} cover: ${publicId}`)
  }

  return coverUrls
}

const seedArticles = async () => {
  await validateSeedData()

  if (validateOnly) {
    console.log('Validation-only mode completed; Cloudinary and MongoDB were not changed.')
    return
  }

  await connectDatabase()

  try {
    const authorId = await findAuthorId()

    // 先讓 27 張圖片全部成功取得 URL，才開始發布文章，避免建立缺少封面的正式內容。
    const coverUrls = await prepareCoverImages()
    const firstPublishedAt = Date.UTC(2026, 7, 10, 1, 0, 0)

    for (const [index, article] of academyArticles.entries()) {
      const coverImageUrl = coverUrls.get(article.slug)

      if (!coverImageUrl) throw new Error(`${article.slug} 缺少已驗證的 Cloudinary URL`)

      await Article.updateOne(
        { slug: article.slug },
        {
          $set: {
            ...article,
            content: sanitizeArticleContent(article.content.trim()),
            coverImageUrl,
            status: 'published',
            author: authorId,
            publishedAt: new Date(firstPublishedAt + index * 24 * 60 * 60 * 1000),
          },
        },
        {
          upsert: true,
          runValidators: true,
        },
      )

      console.log(`Upserted article: ${article.slug}`)
    }

    const slugs = academyArticles.map(({ slug }) => slug)
    const savedArticles = await Article.find({
      slug: mongoose.trusted({ $in: slugs }),
    })
      .select('slug category coverImageUrl status')
      .lean()
    const savedCategoryCounts = Object.fromEntries(
      ARTICLE_CATEGORIES.map((category) => [
        category,
        savedArticles.filter((article) => article.category === category).length,
      ]),
    )

    if (
      savedArticles.length !== 27 ||
      savedArticles.some(({ coverImageUrl, status }) => !coverImageUrl || status !== 'published')
    ) {
      throw new Error('MongoDB 寫入後驗證失敗：文章數量、發布狀態或封面不完整')
    }

    console.log('Academy article seed completed:', {
      total: savedArticles.length,
      categories: savedCategoryCounts,
      publishedWithCover: savedArticles.length,
    })
  } finally {
    await mongoose.disconnect()
  }
}

seedArticles().catch(async (error: unknown) => {
  console.error(getSafeErrorMessage(error))

  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()

  process.exitCode = 1
})
