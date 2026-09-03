import { Schema, model, type Types } from 'mongoose'

export interface IEvent {
  title: string
  summary: string
  content?: string | undefined
  location: string
  startAt: Date
  endAt: Date
  distance: string
  capacity?: number | undefined
  notes: string[]
  createdBy: Types.ObjectId
  participants: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
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
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    distance: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    capacity: {
      type: Number,
      min: 1,
    },
    notes: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

eventSchema.index({ endAt: 1, startAt: 1 })

const Event = model('Event', eventSchema)

export default Event
