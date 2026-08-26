import { Router } from 'express'

import { registerAdminPlazaHandlers } from '../controllers/adminPlazaController.js'
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken, requireAdmin)
registerAdminPlazaHandlers(router)

export default router
