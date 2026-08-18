import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

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

router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      res.status(400).json({
        message: 'username、email 和 password 都是必填欄位',
      })
      return
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      res.status(409).json({
        message: '這個 Email 已經註冊',
      })
      return
    }

    const user = await User.create({
      username,
      email,
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
    console.error('Failed to create user:', error)

    res.status(500).json({
      message: '建立使用者失敗',
    })
  }
})

export default router
