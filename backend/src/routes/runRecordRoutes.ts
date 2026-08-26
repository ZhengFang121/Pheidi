import { Router } from 'express'

import { registerRunRecordHandlers } from '../controllers/runRecordController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerRunRecordHandlers(router)

export default router