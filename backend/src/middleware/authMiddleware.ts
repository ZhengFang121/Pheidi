import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'

export const authenticateToken: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({
      message: '請先登入',
    })
    return
  }

  const token = authorization.slice(7).trim()

  if (!token) {
    res.status(401).json({
      message: '請先登入',
    })
    return
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    console.error('Missing JWT_SECRET environment variable')

    res.status(500).json({
      message: '伺服器驗證設定錯誤',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)

    if (
      typeof decoded === 'string' ||
      typeof decoded.userId !== 'string' ||
      (decoded.role !== 'player' && decoded.role !== 'admin')
    ) {
      res.status(401).json({
        message: '無效的登入憑證',
      })
      return
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    }

    next()
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: '登入狀態已過期，請重新登入',
      })
      return
    }

    res.status(401).json({
      message: '無效的登入憑證',
    })
  }
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      message: '請先登入',
    })
    return
  }

  try {
    const adminUser = await User.exists({
      _id: req.user.userId,
      role: 'admin',
    })

    if (!adminUser) {
      res.status(403).json({
        message: '您沒有管理員權限',
      })
      return
    }

    next()
  } catch (error: unknown) {
    console.error('Failed to verify admin permission:', error)

    res.status(500).json({
      message: '無法驗證管理員權限',
    })
  }
}
