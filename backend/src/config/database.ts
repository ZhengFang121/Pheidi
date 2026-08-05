import mongoose from 'mongoose'

export const connectDatabase = async () => {
  const mongodbUri = process.env.MONGODB_URI

  if (!mongodbUri) {
    throw new Error('找不到 MONGODB_URI 環境變數')
  }

  await mongoose.connect(mongodbUri)

  console.log('MongoDB connected successfully')
}
