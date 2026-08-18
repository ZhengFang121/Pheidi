import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateToken } from '../middleware/authMiddleware.js'
import User from '../models/User.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isDuplicateKeyError = (error: unknown) => {
  return typeof error === 'object' && error !== null && Reflect.get(error, 'code') === 11000
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: 'email 和 password 都是必填欄位',
      })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail }).select('+password')

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        message: 'Email 或密碼錯誤',
      })
      return
    }

    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      throw new Error('找不到 JWT_SECRET 環境變數')
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: '7d',
      },
    )

    res.status(200).json({
      message: '登入成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Failed to log in:', error)

    res.status(500).json({
      message: '登入失敗，請稍後再試',
    })
  }
})

router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: '請先登入',
      })
      return
    }

    const user = await User.findById(req.user.userId)

    if (!user) {
      res.status(404).json({
        message: '找不到使用者',
      })
      return
    }

    res.status(200).json({
      message: '取得使用者資料成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Failed to get current user:', error)

    res.status(500).json({
      message: '取得使用者資料失敗',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {}

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: 'username、email 和 password 都是必填欄位',
      })
      return
    }

    const normalizedUsername = username.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedUsername.length < 2 || normalizedUsername.length > 20) {
      res.status(400).json({
        message: '跑者名稱需要 2 到 20 個字元',
      })
      return
    }

    if (!emailPattern.test(normalizedEmail)) {
      res.status(400).json({
        message: '請輸入正確的電子信箱格式',
      })
      return
    }

    if (password.length < 8) {
      res.status(400).json({
        message: '密碼至少需要 8 個字元',
      })
      return
    }

    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      res.status(409).json({
        message: '這個 Email 已經註冊',
      })
      return
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    })

    res.status(201).json({
      message: '使用者建立成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        message: '這個 Email 已經註冊',
      })
      return
    }

    console.error('Failed to create user:', error)

    res.status(500).json({
      message: '建立使用者失敗',
    })
  }
})

export default router