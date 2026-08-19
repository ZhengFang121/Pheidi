import { Router } from 'express'

import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'
import User from '../models/User.js'

const router = Router()

const defaultPage = 1
const defaultLimit = 10
const maximumLimit = 50

const parsePositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value !== 'string') return fallback

  const parsedValue = Number.parseInt(value, 10)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

const escapeRegularExpression = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/*
 * 所有 /api/admin 路由都必須先通過登入與管理員驗證。
 */
router.use(authenticateToken, requireAdmin)

router.get('/check', (_req, res) => {
  res.status(200).json({
    message: '管理員權限驗證成功',
  })
})

router.get('/users', async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, defaultPage)
    const requestedLimit = parsePositiveInteger(req.query.limit, defaultLimit)
    const limit = Math.min(requestedLimit, maximumLimit)
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const skip = (page - 1) * limit

    const escapedSearch = escapeRegularExpression(search)

    const filter = search
      ? {
          $or: [
            {
              username: {
                $regex: escapedSearch,
                $options: 'i',
              },
            },
            {
              email: {
                $regex: escapedSearch,
                $options: 'i',
              },
            },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('_id username email role createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ])

    res.status(200).json({
      message: '取得玩家列表成功',
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error('Failed to get admin user list:', error)

    res.status(500).json({
      message: '取得玩家列表失敗',
    })
  }
})

export default router
