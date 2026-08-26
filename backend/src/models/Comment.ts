import { Schema, model, type Types } from 'mongoose'

export interface IComment {
  content: string
  post: Types.ObjectId
  author: Types.ObjectId
  likedBy: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likedBy: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

commentSchema.index({ post: 1, createdAt: 1 })
commentSchema.index({ author: 1, createdAt: -1 })

const Comment = model('Comment', commentSchema)

export default Comment
