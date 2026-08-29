import { Schema, model, type Types } from 'mongoose'

import type { RunnerLevel } from '../constants/runnerLevels.js'

export interface IRunnerProgress {
  user: Types.ObjectId
  currentLevel: RunnerLevel
  createdAt?: Date
  updatedAt?: Date
}

const runnerProgressSchema = new Schema<IRunnerProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      immutable: true,
    },
    currentLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const RunnerProgress = model('RunnerProgress', runnerProgressSchema)

export default RunnerProgress
