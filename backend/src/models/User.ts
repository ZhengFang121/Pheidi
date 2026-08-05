import bcrypt from 'bcrypt'
import { Schema, model } from 'mongoose'

export interface IUser {
  username: string
  email: string
  password: string
  role: 'player' | 'admin'
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['player', 'admin'],
      default: 'player',
    },
  },
  {
    timestamps: true,
  },
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, 12)
})

const User = model<IUser>('User', userSchema)

export default User
