import { Router } from 'express'

import { registerPostUploadHandlers } from '../controllers/uploadController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerPostUploadHandlers(router)

export default router
