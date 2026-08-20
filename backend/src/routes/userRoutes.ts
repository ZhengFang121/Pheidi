import { Router } from 'express'

import { registerUserHandlers } from '../controllers/userController.js'

const router = Router()

registerUserHandlers(router)

export default router
