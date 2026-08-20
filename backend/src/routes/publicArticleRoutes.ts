import { Router } from 'express'

import { registerPublicArticleHandlers } from '../controllers/publicArticleController.js'

const router = Router()

registerPublicArticleHandlers(router)

export default router
