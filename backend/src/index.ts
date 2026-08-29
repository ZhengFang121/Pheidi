import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDatabase } from './configs/database.js'

import adminRoutes from './routes/adminRoutes.js'
import adminPlazaRoutes from './routes/adminPlazaRoutes.js'
import articleRoutes from './routes/articleRoutes.js'
import postRoutes from './routes/postRoutes.js'
import postUploadRoutes from './routes/postUploadRoutes.js'
import publicArticleRoutes from './routes/publicArticleRoutes.js'
import runRecordRoutes from './routes/runRecordRoutes.js'
import runRecordUploadRoutes from './routes/runRecordUploadRoutes.js'
import runnerProgressRoutes from './routes/runnerProgressRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

const port = Number(process.env.PORT) || 3000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: clientOrigin,
  }),
)

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    message: 'Pheidi the Runner API is running!',
  })
})

app.use('/api/admin/articles', articleRoutes)
app.use('/api/admin/uploads', uploadRoutes)
app.use('/api/uploads', postUploadRoutes)
app.use('/api/articles', publicArticleRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/run-records', runRecordRoutes)
app.use('/api/run-record-uploads', runRecordUploadRoutes)
app.use('/api/runner-progress', runnerProgressRoutes)
app.use('/api/admin/plaza', adminPlazaRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)

const startServer = async () => {
  try {
    await connectDatabase()

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Server failed to start:', error)
    process.exit(1)
  }
}

startServer()
