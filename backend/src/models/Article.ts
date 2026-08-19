import { Schema, model, type Types } from 'mongoose'

export const ARTICLE_CATEGORIES = [
  'learning',
  'equipment',
  'nutrition',
  'events',
] as const

export const ARTICLE_STATUSES = ['draft', 'published'] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]

export interface IArticle {
  title: string
  slug: string
  summary: string
  content: string
  category: ArticleCategory
  coverImageUrl?: string | undefined
  status: ArticleStatus
  author: Types.ObjectId
  publishedAt?: Date | undefined
  createdAt?: Date
  updatedAt?: Date
}

const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ARTICLE_CATEGORIES,
      required: true,
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ARTICLE_STATUSES,
      default: 'draft',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

const Article = model('Article', articleSchema)

export default Article