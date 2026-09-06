import { Schema, model, type Types } from 'mongoose'

export interface IPostImage {
  url: string
  publicId?: string | undefined
  width?: number | undefined
  height?: number | undefined
}

export interface IPost {
  content: string
  images: IPostImage[]
  /** 舊版單張圖片欄位，保留供既有資料讀取與刪除。 */
  imageUrl?: string | undefined
  imagePublicId?: string | undefined
  author: Types.ObjectId
  likedBy: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const postImageSchema = new Schema<IPostImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
      min: 1,
    },
    height: {
      type: Number,
      min: 1,
    },
  },
  {
    _id: false,
  },
)

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    images: {
      type: [postImageSchema],
      default: [],
      validate: {
        validator: (images: IPostImage[]) => images.length <= 4,
        message: '貼文最多只能包含 4 張圖片',
      },
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imagePublicId: {
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
