import { Router } from 'express'

import { registerPublicArticleHandlers } from '../controllers/publicArticleController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerPublicArticleHandlers(router)

export default router
