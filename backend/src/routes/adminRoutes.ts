import { Router } from 'express'

import { registerAdminHandlers } from '../controllers/adminController.js'
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken, requireAdmin)
registerAdminHandlers(router)

export default router
