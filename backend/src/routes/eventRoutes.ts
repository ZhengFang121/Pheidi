import { Router } from 'express'

import { registerEventHandlers } from '../controllers/eventController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerEventHandlers(router)

export default router
