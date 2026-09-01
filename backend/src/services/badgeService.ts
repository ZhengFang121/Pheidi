import {
  BADGE_DEFINITIONS,
  getBadgeStorageKeys,
  resolveBadgeKey,
  type BadgeKey,
} from '../constants/badges.js'
import RunRecord from '../models/RunRecord.js'
import UserBadge from '../models/UserBadge.js'
import type { ProgressRunRecord, UnlockedBadgeResult } from '../types/runnerProgress.js'
import { isDuplicateKeyError } from '../utils/mongoose.js'

const TAIPEI_TIME_ZONE = 'Asia/Taipei'
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const taipeiDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TAIPEI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

interface TaipeiCalendarParts {
  year: number
  month: number
  day: number
  hour: number
}

const getTaipeiCalendarParts = (date: Date): TaipeiCalendarParts => {
  const parts = new Map(
    taipeiDateTimeFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  )
  const year = Number(parts.get('year'))
  const month = Number(parts.get('month'))
  const day = Number(parts.get('day'))
  const hour = Number(parts.get('hour'))

  if ([year, month, day, hour].some((value) => !Number.isInteger(value))) {
    throw new Error('無法解析台灣日期時間')
  }

  return {
    year,
    month,
    day,
    hour,
  }
}

const createDateKey = ({ year, month, day }: Omit<TaipeiCalendarParts, 'hour'>) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const getMondayWeekStartSerial = ({ year, month, day }: Omit<TaipeiCalendarParts, 'hour'>) => {
  const localDateSerial = Math.floor(Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY)
  const dayOfWeek = new Date(localDateSerial * MILLISECONDS_PER_DAY).getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7

  return localDateSerial - daysSinceMonday
}

export const hasFourWeekRunningStreak = (runRecords: readonly ProgressRunRecord[]) => {
  const runningDatesByWeek = new Map<number, Set<string>>()

  for (const runRecord of runRecords) {
    const { year, month, day } = getTaipeiCalendarParts(runRecord.runDate)
    const weekStartSerial = getMondayWeekStartSerial({ year, month, day })
    const runningDates = runningDatesByWeek.get(weekStartSerial) ?? new Set<string>()

    runningDates.add(createDateKey({ year, month, day }))
    runningDatesByWeek.set(weekStartSerial, runningDates)
  }

  const qualifiedWeeks = [...runningDatesByWeek.entries()]
    .filter(([, runningDates]) => runningDates.size >= 2)
    .map(([weekStartSerial]) => weekStartSerial)
    .sort((first, second) => first - second)

  let consecutiveWeekCount = 0
  let previousWeekStart: number | undefined

  for (const weekStart of qualifiedWeeks) {
    consecutiveWeekCount =
      previousWeekStart !== undefined && weekStart - previousWeekStart === 7
        ? consecutiveWeekCount + 1
        : 1

    if (consecutiveWeekCount >= 4) {
      return true
    }

    previousWeekStart = weekStart
  }

  return false
}

export const getEligibleBadgeKeys = (runRecords: readonly ProgressRunRecord[]): BadgeKey[] => {
  const eligibleBadgeKeys = new Set<BadgeKey>()
  const locationTypes = new Set(runRecords.map((runRecord) => runRecord.locationType))
  const weatherConditions = new Set(runRecords.map((runRecord) => runRecord.weather.condition))
  const totalDistance = runRecords.reduce((total, runRecord) => total + runRecord.distance, 0)
  const photoRunCount = runRecords.filter((runRecord) => runRecord.images.length > 0).length
  const taipeiRunHours = runRecords.map(
    (runRecord) => getTaipeiCalendarParts(runRecord.runDate).hour,
  )

  if (runRecords.length >= 1) eligibleBadgeKeys.add('first-step')
  if (runRecords.some(({ distance }) => distance >= 3)) {
    eligibleBadgeKeys.add('three-kilometer')
  }
  if (runRecords.some(({ distance }) => distance >= 5)) {
    eligibleBadgeKeys.add('five-kilometer')
  }
  if (taipeiRunHours.some((hour) => hour >= 5 && hour < 8)) {
    eligibleBadgeKeys.add('dawn-runner')
  }
  if (taipeiRunHours.some((hour) => hour >= 18 || hour < 5)) {
    eligibleBadgeKeys.add('moonlight-runner')
  }
  if (runRecords.length >= 5) eligibleBadgeKeys.add('run-count-5')
  if (runRecords.length >= 10) eligibleBadgeKeys.add('run-count-10')
  if (totalDistance >= 50) eligibleBadgeKeys.add('distance-50k')
  if (totalDistance >= 100) eligibleBadgeKeys.add('distance-100k')
  if (locationTypes.has('city')) eligibleBadgeKeys.add('city-runner')
  if (locationTypes.has('track')) eligibleBadgeKeys.add('track-runner')
  if (locationTypes.has('mountain')) eligibleBadgeKeys.add('trail-adventurer')
  if (locationTypes.size >= 3) eligibleBadgeKeys.add('location-explorer')
  if (locationTypes.size >= 5) eligibleBadgeKeys.add('all-terrain-runner')
  if (weatherConditions.has('rainy')) eligibleBadgeKeys.add('rain-runner')
  if (
    weatherConditions.has('sunny') &&
    weatherConditions.has('cloudy') &&
    weatherConditions.has('rainy')
  ) {
    eligibleBadgeKeys.add('weather-collector')
  }
  if (runRecords.some(({ mood }) => mood === 'tired')) {
    eligibleBadgeKeys.add('tired-runner')
  }
  if (photoRunCount >= 1) eligibleBadgeKeys.add('scenic-moments')
  if (photoRunCount >= 5) eligibleBadgeKeys.add('photo-collector')
  if (hasFourWeekRunningStreak(runRecords)) {
    eligibleBadgeKeys.add('four-week-streak')
  }

  return BADGE_DEFINITIONS.map(({ key }) => key).filter((key) => eligibleBadgeKeys.has(key))
}

export const unlockEligibleBadges = async (userId: string): Promise<UnlockedBadgeResult[]> => {
  const runRecords = await RunRecord.find({ user: userId })
    .select('runDate distance locationType mood weather.condition images')
    .lean<ProgressRunRecord[]>()
  const eligibleBadgeKeys = getEligibleBadgeKeys(runRecords)
  const storedBadges = await UserBadge.find({ user: userId }).select('badgeKey').lean()
  const unlockedBadgeKeys = new Set(
    storedBadges
      .map(({ badgeKey }) => resolveBadgeKey(badgeKey))
      .filter((badgeKey): badgeKey is BadgeKey => badgeKey !== undefined),
  )

  const unlockedBadges = await Promise.all(
    eligibleBadgeKeys.map(async (badgeKey) => {
      if (unlockedBadgeKeys.has(badgeKey)) return null

      const unlockedAt = new Date()

      try {
        const result = await UserBadge.updateOne(
          {
            user: userId,
            badgeKey: {
              $in: getBadgeStorageKeys(badgeKey),
            },
          },
          {
            $setOnInsert: {
              user: userId,
              badgeKey,
              unlockedAt,
            },
          },
          {
            upsert: true,
          },
        )

        return result.upsertedCount === 1
          ? {
              badgeKey,
              unlockedAt,
            }
          : null
      } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
          return null
        }

        throw error
      }
    }),
  )

  return unlockedBadges.filter((badge): badge is UnlockedBadgeResult => badge !== null)
}
