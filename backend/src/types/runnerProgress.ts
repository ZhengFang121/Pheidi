import type { BadgeKey } from '../constants/badges.js'
import type { RunnerLevel } from '../constants/runnerLevels.js'
import type { RunLocationType, RunMood, WeatherCondition } from '../models/RunRecord.js'

export interface ProgressRunRecord {
  runDate: Date
  distance: number
  locationType: RunLocationType
  mood: RunMood
  weather: {
    condition: WeatherCondition
  }
  images: string[]
}

export interface RunnerStats {
  runCount: number
  totalDistance: number
  distinctLocationCount: number
  badgeCount: number
}

export interface UnlockedBadgeResult {
  badgeKey: BadgeKey
  unlockedAt: Date
}

export interface RunnerProgressRefreshResult {
  previousLevel: RunnerLevel
  currentLevel: RunnerLevel
  levelUp: {
    from: RunnerLevel
    to: RunnerLevel
  } | null
  stats: RunnerStats
  pheidiMissionEligible: boolean
}
