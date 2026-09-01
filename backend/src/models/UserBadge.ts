import { Schema, model, type Types } from 'mongoose'

import { BADGE_STORAGE_KEYS, type BadgeStorageKey } from '../constants/badges.js'

export interface IUserBadge {
  user: Types.ObjectId
  badgeKey: BadgeStorageKey
  unlockedAt: Date
  createdAt?: Date
  updatedAt?: Date
}

const userBadgeSchema = new Schema<IUserBadge>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    badgeKey: {
      type: String,
      enum: BADGE_STORAGE_KEYS,
      required: true,
      immutable: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
)

userBadgeSchema.index({ user: 1, badgeKey: 1 }, { unique: true })

const UserBadge = model('UserBadge', userBadgeSchema)

export default UserBadge
