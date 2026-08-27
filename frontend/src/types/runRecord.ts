import type {
  RunLocationType,
  RunMood,
  WeatherCondition,
  WeatherSource,
} from '@/constants/runRecord'

export interface RunRecordWeather {
  condition: WeatherCondition
  source: WeatherSource
}

export interface RunRecord {
  id: string
  runDate: string
  distance: number
  duration: number
  locationType: RunLocationType
  mood: RunMood
  weather: RunRecordWeather
  images: string[]
  missionId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRunRecordPayload {
  runDate: string
  distance: number
  duration: number
  locationType: RunLocationType
  mood: RunMood
  weather: RunRecordWeather
  images: string[]
  missionId?: string
}

export interface CreateRunRecordResponse {
  message: string
  runRecord: RunRecord
}

export type UpdateRunRecordPayload =
  CreateRunRecordPayload

export interface UpdateRunRecordResponse {
  message: string
  runRecord: RunRecord
}

export interface GetRunRecordsParams {
  start: string
  end: string
}

export interface GetRunRecordsResponse {
  message: string
  runRecords: RunRecord[]
}

export interface UploadedRunRecordImage {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface UploadRunRecordImageResponse {
  message: string
  image: UploadedRunRecordImage
}