import { Router } from 'express'

import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/check', authenticateToken, requireAdmin, (_req, res) => {
  res.status(200).json({
    message: '管理員權限驗證成功',
  })
})

export default router