import type { Router } from 'express'
import { isValidObjectId, Types } from 'mongoose'
import sanitizeHtml from 'sanitize-html'

import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import { parsePositiveInteger } from '../utils/query.js'

const defaultPage = 1
const defaultLimit = 10
const maximumLimit = 30
const defaultCommentLimit = 20
const maximumCommentLimit = 50

interface PostFormData {
  content: string
  imageUrl?: string
  imagePublicId?: string
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

type CommentValidationResult =
  | {
      isValid: true
      content: string
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

  const { content, imageUrl, imagePublicId } = body as Record<string, unknown>

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
  const normalizedImagePublicId = typeof imagePublicId === 'string' ? imagePublicId.trim() : ''

  if (normalizedImageUrl && !isValidImageUrl(normalizedImageUrl)) {
    return {
      isValid: false,
      message: '貼文圖片網址格式不正確',
    }
  }

  if (
    normalizedImagePublicId &&
    (!normalizedImageUrl ||
      normalizedImagePublicId.length > 255 ||
      !normalizedImagePublicId.startsWith('pheidi/posts/'))
  ) {
    return {
      isValid: false,
      message: '貼文圖片識別碼格式不正確',
    }
  }

  return {
    isValid: true,
    data: {
      content: sanitizedContent,
      ...(normalizedImageUrl
        ? {
            imageUrl: normalizedImageUrl,
            ...(normalizedImagePublicId
              ? {
                  imagePublicId: normalizedImagePublicId,
                }
              : {}),
          }
        : {}),
    },
  }
}

const validateCommentFormData = (body: unknown): CommentValidationResult => {
  if (typeof body !== 'object' || body === null) {
    return {
      isValid: false,
      message: '留言資料格式不正確',
    }
  }

  const { content } = body as Record<string, unknown>

  if (typeof content !== 'string' || !content.trim()) {
    return {
      isValid: false,
      message: '請輸入留言內容',
    }
  }

  if (content.trim().length > 200) {
    return {
      isValid: false,
      message: '留言內容不能超過 200 個字元',
    }
  }

  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()

  if (!sanitizedContent) {
    return {
      isValid: false,
      message: '留言內容不能只有 HTML 標籤',
    }
  }

  return {
    isValid: true,
    content: sanitizedContent,
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
              ...(validationResult.data.imagePublicId
                ? {
                    imagePublicId: validationResult.data.imagePublicId,
                  }
                : {}),
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

      const commentCounts = await Comment.aggregate<{
        _id: Types.ObjectId
        count: number
      }>([
        {
          $match: {
            post: {
              $in: posts.map((post) => post._id),
            },
          },
        },
        {
          $group: {
            _id: '$post',
            count: {
              $sum: 1,
            },
          },
        },
      ])
      const commentCountByPostId = new Map(
        commentCounts.map(({ _id, count }) => [_id.toString(), count]),
      )

      res.status(200).json({
        message: '取得跑友動態成功',
        posts: posts.map((post) => ({
          id: post._id,
          content: post.content,
          imageUrl: post.imageUrl,
          author: post.author,
          likeCount: post.likedBy.length,
          isLiked: post.likedBy.some((userId) => userId.toString() === currentUserId),
          commentCount: commentCountByPostId.get(post._id.toString()) ?? 0,
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

  // 新增留言
  router.post('/:postId/comments', async (req, res) => {
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

      const validationResult = validateCommentFormData(req.body)

      if (!validationResult.isValid) {
        res.status(400).json({
          message: validationResult.message,
        })
        return
      }

      const [postExists, authorExists] = await Promise.all([
        Post.exists({ _id: postId }),
        User.exists({ _id: req.user.userId }),
      ])

      if (!postExists) {
        res.status(404).json({
          message: '找不到貼文',
        })
        return
      }

      if (!authorExists) {
        res.status(404).json({
          message: '找不到使用者',
        })
        return
      }

      const comment = await Comment.create({
        content: validationResult.content,
        post: postId,
        author: req.user.userId,
        likedBy: [],
      })

      await comment.populate('author', 'username')

      const commentCount = await Comment.countDocuments({ post: postId })

      res.status(201).json({
        message: '留言發布成功',
        comment: {
          id: comment._id,
          content: comment.content,
          author: comment.author,
          likeCount: 0,
          isLiked: false,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
        commentCount,
      })
    } catch (error: unknown) {
      console.error('Failed to create comment:', error)

      res.status(500).json({
        message: '發布留言失敗',
      })
    }
  })

  // 取得留言
  router.get('/:postId/comments', async (req, res) => {
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

      const postExists = await Post.exists({ _id: postId })

      if (!postExists) {
        res.status(404).json({
          message: '找不到貼文',
        })
        return
      }

      const page = parsePositiveInteger(req.query.page, defaultPage)
      const requestedLimit = parsePositiveInteger(req.query.limit, defaultCommentLimit)
      const limit = Math.min(requestedLimit, maximumCommentLimit)
      const skip = (page - 1) * limit

      const [comments, total] = await Promise.all([
        Comment.find({ post: postId })
          .select('_id content author likedBy createdAt updatedAt')
          .populate('author', 'username')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Comment.countDocuments({ post: postId }),
      ])

      res.status(200).json({
        message: '取得留言成功',
        comments: comments.map((comment) => ({
          id: comment._id,
          content: comment.content,
          author: comment.author,
          likeCount: (comment.likedBy ?? []).length,
          isLiked: (comment.likedBy ?? []).some((userId) => userId.toString() === req.user?.userId),
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error: unknown) {
      console.error('Failed to get comments:', error)

      res.status(500).json({
        message: '取得留言失敗',
      })
    }
  })

  // 按讚或取消按讚留言
  router.patch('/:postId/comments/:commentId/like', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { postId, commentId } = req.params

      if (!postId || !commentId || !isValidObjectId(postId) || !isValidObjectId(commentId)) {
        res.status(400).json({
          message: '貼文或留言 ID 格式不正確',
        })
        return
      }

      const comment = await Comment.findOne({
        _id: commentId,
        post: postId,
      }).select('likedBy')

      if (!comment) {
        res.status(404).json({
          message: '找不到留言',
        })
        return
      }

      const currentUserId = req.user.userId
      const hasLiked = comment.likedBy.some((userId) => userId.toString() === currentUserId)

      if (hasLiked) {
        comment.likedBy = comment.likedBy.filter((userId) => userId.toString() !== currentUserId)
      } else {
        comment.likedBy.push(new Types.ObjectId(currentUserId))
      }

      await comment.save()

      res.status(200).json({
        message: hasLiked ? '已取消留言按讚' : '留言按讚成功',
        likeCount: comment.likedBy.length,
        isLiked: !hasLiked,
      })
    } catch (error: unknown) {
      console.error('Failed to toggle comment like:', error)

      res.status(500).json({
        message: '更新留言按讚狀態失敗',
      })
    }
  })

  // 編輯留言
  router.patch('/:postId/comments/:commentId', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { postId, commentId } = req.params

      if (!postId || !commentId || !isValidObjectId(postId) || !isValidObjectId(commentId)) {
        res.status(400).json({
          message: '貼文或留言 ID 格式不正確',
        })
        return
      }

      const validationResult = validateCommentFormData(req.body)

      if (!validationResult.isValid) {
        res.status(400).json({
          message: validationResult.message,
        })
        return
      }

      const comment = await Comment.findOne({
        _id: commentId,
        post: postId,
      })

      if (!comment) {
        res.status(404).json({
          message: '找不到留言',
        })
        return
      }

      if (comment.author.toString() !== req.user.userId) {
        res.status(403).json({
          message: '只能編輯自己的留言',
        })
        return
      }

      comment.content = validationResult.content
      await comment.save()
      await comment.populate('author', 'username')

      res.status(200).json({
        message: '留言更新成功',
        comment: {
          id: comment._id,
          content: comment.content,
          author: comment.author,
          likeCount: comment.likedBy.length,
          isLiked: comment.likedBy.some((userId) => userId.toString() === req.user?.userId),
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      })
    } catch (error: unknown) {
      console.error('Failed to update comment:', error)

      res.status(500).json({
        message: '更新留言失敗',
      })
    }
  })

  // 刪除留言
  router.delete('/:postId/comments/:commentId', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { postId, commentId } = req.params

      if (!postId || !commentId || !isValidObjectId(postId) || !isValidObjectId(commentId)) {
        res.status(400).json({
          message: '貼文或留言 ID 格式不正確',
        })
        return
      }

      const [comment, currentUser] = await Promise.all([
        Comment.findOne({
          _id: commentId,
          post: postId,
        }),
        User.findById(req.user.userId).select('role'),
      ])

      if (!comment) {
        res.status(404).json({
          message: '找不到留言',
        })
        return
      }

      if (!currentUser) {
        res.status(404).json({
          message: '找不到使用者',
        })
        return
      }

      const isCommentAuthor = comment.author.toString() === req.user.userId
      const isAdmin = currentUser.role === 'admin'

      if (!isCommentAuthor && !isAdmin) {
        res.status(403).json({
          message: '沒有權限刪除此留言',
        })
        return
      }

      await comment.deleteOne()

      const commentCount = await Comment.countDocuments({ post: postId })

      res.status(200).json({
        message: '留言刪除成功',
        commentCount,
      })
    } catch (error: unknown) {
      console.error('Failed to delete comment:', error)

      res.status(500).json({
        message: '刪除留言失敗',
      })
    }
  })
}
