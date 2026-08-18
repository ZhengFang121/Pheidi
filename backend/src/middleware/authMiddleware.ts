import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

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
