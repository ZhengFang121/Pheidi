import { Router } from 'express'

import { registerRunnerProgressHandlers } from '../controllers/runnerProgressController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerRunnerProgressHandlers(router)

export default router
