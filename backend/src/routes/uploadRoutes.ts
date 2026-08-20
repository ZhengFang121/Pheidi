import { Router } from 'express'

import { registerUploadHandlers } from '../controllers/uploadController.js'
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken, requireAdmin)
registerUploadHandlers(router)

export default router
