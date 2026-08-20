import { Router } from 'express'

import { registerArticleHandlers } from '../controllers/articleController.js'
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken, requireAdmin)
registerArticleHandlers(router)

export default router
