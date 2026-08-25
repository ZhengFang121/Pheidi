import { Router } from 'express'

import { registerPostHandlers } from '../controllers/postController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerPostHandlers(router)

export default router
