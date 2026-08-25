import { Schema, model, type Types } from 'mongoose'

export interface IPost {
  content: string
  imageUrl?: string | undefined
  author: Types.ObjectId
  likedBy: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
)

postSchema.index({ createdAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })

const Post = model('Post', postSchema)

export default Post
