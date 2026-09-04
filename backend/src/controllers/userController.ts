import { createHash, randomBytes } from 'node:crypto'
import type { Router } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import { authenticateToken } from '../middleware/authMiddleware.js'
import User from '../models/User.js'
import { sendPasswordResetEmail } from '../services/emailService.js'
import { ensureRunnerProgress } from '../services/runnerProgressService.js'
import { isDuplicateKeyError } from '../utils/mongoose.js'
import { rateLimit } from 'express-rate-limit'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: '申請次數過多，請 15 分鐘後再試',
  },
})

export const registerUserHandlers = (router: Router) => {
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const responseMessage = '如果這個電子信箱已經註冊，我們會寄出密碼重設信'

  try {
    const { email } = req.body ?? {}

    if (typeof email !== 'string' || !emailPattern.test(email.trim().toLowerCase())) {
      res.status(400).json({
        message: '請輸入正確的電子信箱格式',
      })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (user) {
      try {
        const resetToken = randomBytes(32).toString('hex')
        const resetTokenHash = createHash('sha256').update(resetToken).digest('hex')
        const clientOrigin = process.env.CLIENT_ORIGIN

        if (!clientOrigin) {
          throw new Error('找不到 CLIENT_ORIGIN 環境變數')
        }

        user.passwordResetTokenHash = resetTokenHash
        user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

        await user.save()

        const resetUrl = new URL('/reset-password', clientOrigin)
        resetUrl.searchParams.set('token', resetToken)

        await sendPasswordResetEmail({
          recipientEmail: user.email,
          resetUrl: resetUrl.toString(),
        })
      } catch (error) {
        console.error('Failed to create or send password reset email:', error)
      }
    }

    res.status(200).json({
      message: responseMessage,
    })
  } catch (error) {
    console.error('Failed to request password reset:', error)

    res.status(500).json({
      message: '無法處理密碼重設申請，請稍後再試',
    })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body ?? {}

    if (typeof token !== 'string' || !token) {
      res.status(400).json({
        message: '密碼重設連結無效或已經過期',
      })
      return
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        message: '密碼至少需要 8 個字元',
      })
      return
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: mongoose.trusted({
        $gt: new Date(),
      }),
    }).select('+passwordResetTokenHash +passwordResetExpiresAt')

    if (!user) {
      res.status(400).json({
        message: '密碼重設連結無效或已經過期',
      })
      return
    }

    user.password = password
    user.passwordResetTokenHash = undefined
    user.passwordResetExpiresAt = undefined

    await user.save()

    res.status(200).json({
      message: '密碼重設成功，請使用新密碼登入',
    })
  } catch (error) {
    console.error('Failed to reset password:', error)

    res.status(500).json({
      message: '無法重設密碼，請稍後再試',
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
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

router.patch('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: '請先登入' })
      return
    }

    const { username, email } = req.body ?? {}

    if (typeof username !== 'string' || typeof email !== 'string') {
      res.status(400).json({ message: '跑者名稱和電子信箱都是必填欄位' })
      return
    }

    const normalizedUsername = username.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedUsername.length < 2 || normalizedUsername.length > 20) {
      res.status(400).json({ message: '跑者名稱需要 2 到 20 個字元' })
      return
    }

    if (!emailPattern.test(normalizedEmail)) {
      res.status(400).json({ message: '請輸入正確的電子信箱格式' })
      return
    }

    const emailOwner = await User.findOne({
      email: normalizedEmail,
      _id: mongoose.trusted({ $ne: req.user.userId }),
    })

    if (emailOwner) {
      res.status(409).json({ message: '這個 Email 已經被使用' })
      return
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username: normalizedUsername, email: normalizedEmail },
      { new: true, runValidators: true },
    )

    if (!user) {
      res.status(404).json({ message: '找不到使用者' })
      return
    }

    res.status(200).json({
      message: '基本資料更新成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: '這個 Email 已經被使用' })
      return
    }

    console.error('Failed to update profile:', error)
    res.status(500).json({ message: '更新基本資料失敗，請稍後再試' })
  }
})

router.patch('/me/password', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: '請先登入' })
      return
    }

    const { currentPassword, newPassword } = req.body ?? {}

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ message: '目前密碼和新密碼都是必填欄位' })
      return
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: '新密碼至少需要 8 個字元' })
      return
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ message: '新密碼不可與目前密碼相同' })
      return
    }

    const user = await User.findById(req.user.userId).select('+password')

    if (!user) {
      res.status(404).json({ message: '找不到使用者' })
      return
    }

    if (!(await user.comparePassword(currentPassword))) {
      res.status(400).json({ message: '目前密碼不正確' })
      return
    }

    user.password = newPassword
    user.passwordResetTokenHash = undefined
    user.passwordResetExpiresAt = undefined
    await user.save()

    res.status(200).json({ message: '密碼更新成功' })
  } catch (error) {
    console.error('Failed to update password:', error)
    res.status(500).json({ message: '更新密碼失敗，請稍後再試' })
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
    await ensureRunnerProgress(user._id.toString())

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
}
