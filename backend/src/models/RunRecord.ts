import { Schema, model, type Types } from 'mongoose'

export const RUN_LOCATION_TYPES = [
  'city',
  'gym',
  'track',
  'riverside',
  'mountain',
  'park',
  'other',
] as const

export const RUN_MOODS = ['great', 'good', 'okay', 'tired', 'exhausted'] as const

export const WEATHER_CONDITIONS = ['sunny', 'cloudy', 'rainy'] as const

export const WEATHER_SOURCES = [
  'current-location',
  'taipei-default',
  'manual',
] as const

export type RunLocationType = (typeof RUN_LOCATION_TYPES)[number]
export type RunMood = (typeof RUN_MOODS)[number]
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number]
export type WeatherSource = (typeof WEATHER_SOURCES)[number]

export interface RunRecordWeather {
  condition: WeatherCondition
  source: WeatherSource
}

export interface IRunRecord {
  user: Types.ObjectId
  runDate: Date
  distance: number
  duration: number
  locationType: RunLocationType
  mood: RunMood
  weather: RunRecordWeather
  images: string[]
  missionId?: Types.ObjectId | undefined
  createdAt?: Date
  updatedAt?: Date
}

const isSecureImageUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const weatherSchema = new Schema<RunRecordWeather>(
  {
    condition: {
      type: String,
      enum: WEATHER_CONDITIONS,
      required: true,
    },
    source: {
      type: String,
      enum: WEATHER_SOURCES,
      required: true,
    },
  },
  {
    _id: false,
  },
)

const runRecordSchema = new Schema<IRunRecord>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    runDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value: Date) => value.getTime() <= Date.now(),
        message: '跑步日期時間不能晚於目前時間',
      },
    },
    distance: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: '跑步距離必須大於 0',
      },
    },
    duration: {
      type: Number,
      required: true,
      min: [1, '跑步時長必須大於 0 秒'],
      validate: {
        validator: Number.isInteger,
        message: '跑步時長必須使用整數秒數',
      },
    },
    locationType: {
      type: String,
      enum: RUN_LOCATION_TYPES,
      required: true,
    },
    mood: {
      type: String,
      enum: RUN_MOODS,
      required: true,
    },
    weather: {
      type: weatherSchema,
      required: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (values: string[]) => values.every(isSecureImageUrl),
        message: '跑步照片必須使用有效的 HTTPS 網址',
      },
    },
    missionId: {
      type: Schema.Types.ObjectId,
      ref: 'Mission',
    },
  },
  {
    timestamps: true,
  },
)

runRecordSchema.index({ user: 1, runDate: -1 })

const RunRecord = model('RunRecord', runRecordSchema)

export default RunRecord