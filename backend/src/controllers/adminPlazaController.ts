import type { Router } from 'express'
import { isValidObjectId, type PipelineStage } from 'mongoose'

import cloudinary from '../configs/cloudinary.js'
import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import { parsePositiveInteger } from '../utils/query.js'
import { escapeRegularExpression } from '../utils/regex.js'

const defaultPage = 1
const defaultLimit = 10
const maximumLimit = 50

type PlazaSort = 'newest' | 'oldest'

interface AggregateMetadata {
  total: number
}

interface AdminPlazaPostItem {
  id: string
  content: string
  imageUrl?: string
  author: {
    id: string
    username: string
  }
  likeCount: number
  commentCount: number
  createdAt: Date
}

interface AdminPlazaCommentItem {
  id: string
  content: string
  author: {
    id: string
    username: string
  }
  postId: string
  postExcerpt: string
  likeCount: number
  createdAt: Date
}

interface PostListAggregationResult {
  items: AdminPlazaPostItem[]
  metadata: AggregateMetadata[]
}

interface CommentListAggregationResult {
  items: AdminPlazaCommentItem[]
  metadata: AggregateMetadata[]
}

const parseSort = (value: unknown): PlazaSort => (value === 'oldest' ? 'oldest' : 'newest')

const getPagination = (query: Record<string, unknown>) => {
  const page = parsePositiveInteger(query.page, defaultPage)
  const requestedLimit = parsePositiveInteger(query.limit, defaultLimit)
  const limit = Math.min(requestedLimit, maximumLimit)

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}

const getSearch = (value: unknown) => {
  const search = typeof value === 'string' ? value.trim() : ''

  return escapeRegularExpression(search)
}

const getHasImageFilter = (value: unknown): boolean | undefined => {
  if (value === 'true') return true
  if (value === 'false') return false

  return undefined
}

const createPaginationResponse = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
})

export const registerAdminPlazaHandlers = (router: Router) => {
  router.get('/statistics', async (_req, res) => {
    try {
      const [postStatistics, commentStatistics] = await Promise.all([
        Post.aggregate<{
          totalPosts: number
          postsWithImages: number
          totalPostLikes: number
        }>([
          {
            $group: {
              _id: null,
              totalPosts: { $sum: 1 },
              postsWithImages: {
                $sum: {
                  $cond: [
                    {
                      $gt: [{ $strLenCP: { $ifNull: ['$imageUrl', ''] } }, 0],
                    },
                    1,
                    0,
                  ],
                },
              },
              totalPostLikes: {
                $sum: { $size: { $ifNull: ['$likedBy', []] } },
              },
            },
          },
        ]),
        Comment.aggregate<{
          totalComments: number
          totalCommentLikes: number
        }>([
          {
            $group: {
              _id: null,
              totalComments: { $sum: 1 },
              totalCommentLikes: {
                $sum: { $size: { $ifNull: ['$likedBy', []] } },
              },
            },
          },
        ]),
      ])

      res.status(200).json({
        message: '取得廣場統計成功',
        statistics: {
          totalPosts: postStatistics[0]?.totalPosts ?? 0,
          totalComments: commentStatistics[0]?.totalComments ?? 0,
          postsWithImages: postStatistics[0]?.postsWithImages ?? 0,
          totalPostLikes: postStatistics[0]?.totalPostLikes ?? 0,
          totalCommentLikes: commentStatistics[0]?.totalCommentLikes ?? 0,
        },
      })
    } catch (error: unknown) {
      console.error('Failed to get admin plaza statistics:', error)

      res.status(500).json({
        message: '取得廣場統計失敗',
      })
    }
  })

  router.get('/posts', async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query)
      const search = getSearch(req.query.search)
      const hasImage = getHasImageFilter(req.query.hasImage)
      const sort = parseSort(req.query.sort)

      const initialMatch: Record<string, unknown> = {}

      if (hasImage !== undefined) {
        initialMatch.imageUrl = hasImage ? { $exists: true, $nin: ['', null] } : { $in: ['', null] }
      }

      const pipeline: PipelineStage[] = [
        { $match: initialMatch },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true,
          },
        },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { content: { $regex: search, $options: 'i' } },
                    { 'author.username': { $regex: search, $options: 'i' } },
                  ],
                },
              } satisfies PipelineStage.Match,
            ]
          : []),
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post',
            as: 'comments',
          },
        },
        {
          $facet: {
            items: [
              { $sort: { createdAt: sort === 'oldest' ? 1 : -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 0,
                  id: { $toString: '$_id' },
                  content: 1,
                  imageUrl: 1,
                  author: {
                    id: { $toString: '$author._id' },
                    username: { $ifNull: ['$author.username', '已刪除的使用者'] },
                  },
                  likeCount: { $size: { $ifNull: ['$likedBy', []] } },
                  commentCount: { $size: '$comments' },
                  createdAt: 1,
                },
              },
            ],
            metadata: [{ $count: 'total' }],
          },
        },
      ]

      const [result] = await Post.aggregate<PostListAggregationResult>(pipeline)
      const total = result?.metadata[0]?.total ?? 0

      res.status(200).json({
        message: '取得廣場貼文列表成功',
        items: result?.items ?? [],
        pagination: createPaginationResponse(page, limit, total),
      })
    } catch (error: unknown) {
      console.error('Failed to get admin plaza posts:', error)

      res.status(500).json({
        message: '取得廣場貼文列表失敗',
      })
    }
  })

  router.get('/comments', async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query)
      const search = getSearch(req.query.search)
      const sort = parseSort(req.query.sort)

      const pipeline: PipelineStage[] = [
        { $set: { postId: '$post' } },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true,
          },
        },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { content: { $regex: search, $options: 'i' } },
                    { 'author.username': { $regex: search, $options: 'i' } },
                  ],
                },
              } satisfies PipelineStage.Match,
            ]
          : []),
        {
          $lookup: {
            from: 'posts',
            localField: 'postId',
            foreignField: '_id',
            as: 'postContext',
          },
        },
        {
          $unwind: {
            path: '$postContext',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $facet: {
            items: [
              { $sort: { createdAt: sort === 'oldest' ? 1 : -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 0,
                  id: { $toString: '$_id' },
                  content: 1,
                  author: {
                    id: { $toString: '$author._id' },
                    username: { $ifNull: ['$author.username', '已刪除的使用者'] },
                  },
                  postId: { $toString: '$postId' },
                  postExcerpt: {
                    $substrCP: [{ $ifNull: ['$postContext.content', '所屬貼文已不存在'] }, 0, 80],
                  },
                  likeCount: { $size: { $ifNull: ['$likedBy', []] } },
                  createdAt: 1,
                },
              },
            ],
            metadata: [{ $count: 'total' }],
          },
        },
      ]

      const [result] = await Comment.aggregate<CommentListAggregationResult>(pipeline)
      const total = result?.metadata[0]?.total ?? 0

      res.status(200).json({
        message: '取得廣場留言列表成功',
        items: result?.items ?? [],
        pagination: createPaginationResponse(page, limit, total),
      })
    } catch (error: unknown) {
      console.error('Failed to get admin plaza comments:', error)

      res.status(500).json({
        message: '取得廣場留言列表失敗',
      })
    }
  })

  router.delete('/posts/:postId', async (req, res) => {
    try {
      const { postId } = req.params

      if (!postId || !isValidObjectId(postId)) {
        res.status(400).json({
          message: '貼文 ID 格式不正確',
        })
        return
      }

      const session = await Post.startSession()
      let postFound = false
      let imagePublicId: string | undefined

      try {
        await session.withTransaction(async () => {
          const post = await Post.findById(postId).select('imagePublicId').session(session)

          if (!post) return

          postFound = true
          imagePublicId = post.imagePublicId

          await Comment.deleteMany({ post: postId }).session(session)
          await post.deleteOne({ session })
        })
      } finally {
        await session.endSession()
      }

      if (!postFound) {
        res.status(404).json({
          message: '找不到指定的貼文',
        })
        return
      }

      if (imagePublicId) {
        try {
          await cloudinary.uploader.destroy(imagePublicId, {
            resource_type: 'image',
          })
        } catch (error: unknown) {
          console.error(`Failed to delete Cloudinary image ${imagePublicId}:`, error)
        }
      }

      res.status(200).json({
        message: '貼文及所屬留言刪除成功',
      })
    } catch (error: unknown) {
      console.error('Failed to delete admin plaza post:', error)

      res.status(500).json({
        message: '刪除貼文失敗',
      })
    }
  })

  router.delete('/comments/:commentId', async (req, res) => {
    try {
      const { commentId } = req.params

      if (!commentId || !isValidObjectId(commentId)) {
        res.status(400).json({
          message: '留言 ID 格式不正確',
        })
        return
      }

      const comment = await Comment.findByIdAndDelete(commentId)

      if (!comment) {
        res.status(404).json({
          message: '找不到指定的留言',
        })
        return
      }

      res.status(200).json({
        message: '留言刪除成功',
      })
    } catch (error: unknown) {
      console.error('Failed to delete admin plaza comment:', error)

      res.status(500).json({
        message: '刪除留言失敗',
      })
    }
  })
}
