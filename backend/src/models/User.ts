import bcrypt from 'bcrypt'
import { Schema, model, type Model } from 'mongoose'

export interface IUser {
  username: string
  email: string
  password: string
  role: 'player' | 'admin'
}

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser, Model<IUser>, UserMethods>(
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
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
    methods: {
      async comparePassword(candidatePassword: string) {
        return bcrypt.compare(candidatePassword, this.password)
      },
    },
  },
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, 12)
})

const User = model('User', userSchema)

export default User