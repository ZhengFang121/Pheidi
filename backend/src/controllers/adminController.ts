import type { Router } from 'express'
import mongoose from 'mongoose'

import Article from '../models/Article.js'
import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import { parsePositiveInteger } from '../utils/query.js'
import { escapeRegularExpression } from '../utils/regex.js'


const defaultPage = 1
const defaultLimit = 10
const maximumLimit = 50
const mongoObjectIdPattern = /^[a-f\d]{24}$/i

const getUserStatistics = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [totalUsers, totalPlayers, totalAdmins, newUsersLastSevenDays] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'player' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({
      createdAt: mongoose.trusted({
        $gte: sevenDaysAgo,
      }),
    }),
  ])

  return {
    totalUsers,
    totalPlayers,
    totalAdmins,
    newUsersLastSevenDays,
  }
}

/*
 * 所有 /api/admin 路由都必須先通過登入與管理員驗證。
 */
export const registerAdminHandlers = (router: Router) => {

router.get('/check', (_req, res) => {
  res.status(200).json({
    message: '管理員權限驗證成功',
  })
})

router.get('/dashboard', async (_req, res) => {
  try {
    const [
      userStatistics,
      latestUsers,
      totalArticles,
      publishedArticles,
      draftArticles,
      totalPosts,
      totalComments,
    ] = await Promise.all([
      getUserStatistics(),
      User.find()
        .select('_id username email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }),
      Article.countDocuments({ status: 'draft' }),
      Post.countDocuments(),
      Comment.countDocuments(),
    ])

    res.status(200).json({
      message: '取得管理員儀表板資料成功',
      statistics: {
        ...userStatistics,
        totalArticles,
        publishedArticles,
        draftArticles,
        totalPosts,
        totalComments,
      },
      latestUsers: latestUsers.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    })
  } catch (error: unknown) {
    console.error('Failed to get admin dashboard:', error)

    res.status(500).json({
      message: '取得管理員儀表板資料失敗',
    })
  }
})

router.get('/users/statistics', async (_req, res) => {
  try {
    const statistics = await getUserStatistics()

    res.status(200).json({
      message: '取得玩家統計成功',
      statistics,
    })
  } catch (error: unknown) {
    console.error('Failed to get admin user statistics:', error)

    res.status(500).json({
      message: '取得玩家統計失敗',
    })
  }
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
              username: mongoose.trusted({
                $regex: escapedSearch,
                $options: 'i',
              }),
            },
            {
              email: mongoose.trusted({
                $regex: escapedSearch,
                $options: 'i',
              }),
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

router.patch('/users/:userId/role', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: '請先登入',
      })
      return
    }

    const { userId } = req.params
    const { role } = req.body ?? {}

    if (!userId || !mongoObjectIdPattern.test(userId)) {
      res.status(400).json({
        message: '使用者 ID 格式不正確',
      })
      return
    }

    if (role !== 'player' && role !== 'admin') {
      res.status(400).json({
        message: '使用者角色只能是 player 或 admin',
      })
      return
    }

    if (userId === req.user.userId) {
      res.status(403).json({
        message: '不能修改自己的管理員角色',
      })
      return
    }

    const targetUser = await User.findById(userId)

    if (!targetUser) {
      res.status(404).json({
        message: '找不到指定的使用者',
      })
      return
    }

    if (targetUser.role === role) {
      res.status(200).json({
        message: '使用者角色沒有變更',
        user: {
          id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
          createdAt: targetUser.createdAt,
          updatedAt: targetUser.updatedAt,
        },
      })
      return
    }

    if (targetUser.role === 'admin' && role === 'player') {
      const adminCount = await User.countDocuments({
        role: 'admin',
      })

      if (adminCount <= 1) {
        res.status(409).json({
          message: '系統必須保留至少一位管理員',
        })
        return
      }
    }

    targetUser.role = role

    await targetUser.save()

    res.status(200).json({
      message: role === 'admin' ? '已將使用者設為管理員' : '已將使用者設為玩家',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
    })
  } catch (error: unknown) {
    console.error('Failed to update user role:', error)

    res.status(500).json({
      message: '修改使用者角色失敗',
    })
  }
})

}
