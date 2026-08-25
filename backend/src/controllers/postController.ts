import type { Router } from 'express'
import { isValidObjectId, Types } from 'mongoose'
import sanitizeHtml from 'sanitize-html'

import Post from '../models/Post.js'
import User from '../models/User.js'
import { parsePositiveInteger } from '../utils/query.js'

const defaultPage = 1
const defaultLimit = 10
const maximumLimit = 30

interface PostFormData {
  content: string
  imageUrl?: string
}

type PostValidationResult =
  | {
      isValid: true
      data: PostFormData
    }
  | {
      isValid: false
      message: string
    }

const isValidImageUrl = (value: string) => {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const validatePostFormData = (body: unknown): PostValidationResult => {
  if (typeof body !== 'object' || body === null) {
    return {
      isValid: false,
      message: '貼文資料格式不正確',
    }
  }

  const { content, imageUrl } = body as Record<string, unknown>

  if (typeof content !== 'string' || !content.trim()) {
    return {
      isValid: false,
      message: '請輸入貼文內容',
    }
  }

  if (content.trim().length > 500) {
    return {
      isValid: false,
      message: '貼文內容不能超過 500 個字元',
    }
  }

  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()

  if (!sanitizedContent) {
    return {
      isValid: false,
      message: '貼文內容不能只有 HTML 標籤',
    }
  }

  const normalizedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : ''

  if (normalizedImageUrl && !isValidImageUrl(normalizedImageUrl)) {
    return {
      isValid: false,
      message: '貼文圖片網址格式不正確',
    }
  }

  return {
    isValid: true,
    data: {
      content: sanitizedContent,
      ...(normalizedImageUrl
        ? {
            imageUrl: normalizedImageUrl,
          }
        : {}),
    },
  }
}

export const registerPostHandlers = (router: Router) => {
  // 建立貼文
  router.post('/', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const validationResult = validatePostFormData(req.body)

      if (!validationResult.isValid) {
        res.status(400).json({
          message: validationResult.message,
        })
        return
      }

      const authorExists = await User.exists({
        _id: req.user.userId,
      })

      if (!authorExists) {
        res.status(404).json({
          message: '找不到使用者',
        })
        return
      }

      const post = await Post.create({
        content: validationResult.data.content,
        author: req.user.userId,
        likedBy: [],
        ...(validationResult.data.imageUrl
          ? {
              imageUrl: validationResult.data.imageUrl,
            }
          : {}),
      })

      await post.populate('author', 'username')

      res.status(201).json({
        message: '貼文發布成功',
        post: {
          id: post._id,
          content: post.content,
          imageUrl: post.imageUrl,
          author: post.author,
          likeCount: post.likedBy.length,
          isLiked: false,
          commentCount: 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      })
    } catch (error: unknown) {
      console.error('Failed to create post:', error)

      res.status(500).json({
        message: '發布貼文失敗',
      })
    }
  })
  // 取得貼文
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
      const currentUserId = req.user.userId

      const [posts, total] = await Promise.all([
        Post.find()
          .select('_id content imageUrl author likedBy createdAt updatedAt')
          .populate('author', 'username')
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
        Post.countDocuments(),
      ])

      res.status(200).json({
        message: '取得跑友動態成功',
        posts: posts.map((post) => ({
          id: post._id,
          content: post.content,
          imageUrl: post.imageUrl,
          author: post.author,
          likeCount: post.likedBy.length,
          isLiked: post.likedBy.some((userId) => userId.toString() === currentUserId),
          commentCount: 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error: unknown) {
      console.error('Failed to get post list:', error)

      res.status(500).json({
        message: '取得跑友動態失敗',
      })
    }
  })

  // 按讚或取消按讚
  router.patch('/:postId/like', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { postId } = req.params

      if (!postId || !isValidObjectId(postId)) {
        res.status(400).json({
          message: '貼文 ID 格式不正確',
        })
        return
      }

      const post = await Post.findById(postId).select('likedBy')

      if (!post) {
        res.status(404).json({
          message: '找不到貼文',
        })
        return
      }

      const currentUserId = req.user.userId
      const hasLiked = post.likedBy.some((userId) => userId.toString() === currentUserId)

      if (hasLiked) {
        post.likedBy = post.likedBy.filter((userId) => userId.toString() !== currentUserId)
      } else {
        post.likedBy.push(new Types.ObjectId(currentUserId))
      }

      await post.save()

      res.status(200).json({
        message: hasLiked ? '已取消按讚' : '按讚成功',
        likeCount: post.likedBy.length,
        isLiked: !hasLiked,
      })
    } catch (error: unknown) {
      console.error('Failed to toggle post like:', error)

      res.status(500).json({
        message: '更新按讚狀態失敗',
      })
    }
  })
}
