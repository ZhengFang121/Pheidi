import 'dotenv/config'
import express from 'express'
import { connectDatabase } from './config/database.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    message: 'Pheidi the Runner API is running!',
  })
})

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
