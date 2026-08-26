import { Router } from 'express'

import { registerRunRecordUploadHandlers } from '../controllers/uploadController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
registerRunRecordUploadHandlers(router)

export default router