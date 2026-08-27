import type { Router } from 'express'
import { isValidObjectId } from 'mongoose'

import { BADGE_DEFINITION_BY_KEY } from '../constants/badges.js'
import { getRunnerLevelDefinition } from '../constants/runnerLevels.js'
import RunRecord, {
  RUN_LOCATION_TYPES,
  RUN_MOODS,
  WEATHER_CONDITIONS,
  WEATHER_SOURCES,
  type RunLocationType,
  type RunMood,
  type RunRecordWeather,
} from '../models/RunRecord.js'
import User from '../models/User.js'
import { unlockEligibleBadges } from '../services/badgeService.js'
import { refreshRunnerProgress } from '../services/runnerProgressService.js'
import type {
  RunnerProgressRefreshResult,
  UnlockedBadgeResult,
} from '../types/runnerProgress.js'

const maximumQueryRangeInMilliseconds = 32 * 24 * 60 * 60 * 1000

interface RunRecordFormData {
  runDate: Date
  distance: number
  duration: number
  locationType: RunLocationType
  mood: RunMood
  weather: RunRecordWeather
  images: string[]
  missionId?: string
}

type RunRecordValidationResult =
  | {
      isValid: true
      data: RunRecordFormData
    }
  | {
      isValid: false
      message: string
    }

const createProgressionResponse = (
  newBadges: UnlockedBadgeResult[],
  progression: RunnerProgressRefreshResult,
) => {
  return {
    newBadges: newBadges.map(({ badgeKey, unlockedAt }) => {
      const definition = BADGE_DEFINITION_BY_KEY.get(badgeKey)

      return {
        key: badgeKey,
        name: definition?.name ?? badgeKey,
        description: definition?.description ?? '',
        category: definition?.category ?? 'milestone',
        unlockedAt,
      }
    }),
    levelUp: progression.levelUp
      ? {
          from: progression.levelUp.from,
          to: progression.levelUp.to,
          name: getRunnerLevelDefinition(progression.levelUp.to).name,
        }
      : null,
    currentLevel: progression.currentLevel,
    pheidiMissionEligible: progression.pheidiMissionEligible,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isAllowedValue = <Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] => {
  return typeof value === 'string' && values.includes(value)
}

const isCloudinaryImageUrl = (value: string) => {
  try {
    const url = new URL(value)

    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

const validateRunRecordFormData = (body: unknown): RunRecordValidationResult => {
  if (!isRecord(body)) {
    return {
      isValid: false,
      message: '跑步紀錄資料格式不正確',
    }
  }

  const {
    runDate,
    distance,
    duration,
    locationType,
    mood,
    weather,
    images,
    missionId,
  } = body

  if (typeof runDate !== 'string' || !runDate.trim()) {
    return {
      isValid: false,
      message: '請提供跑步日期時間',
    }
  }

  const parsedRunDate = new Date(runDate)

  if (Number.isNaN(parsedRunDate.getTime())) {
    return {
      isValid: false,
      message: '跑步日期時間格式不正確',
    }
  }

  if (parsedRunDate.getTime() > Date.now()) {
    return {
      isValid: false,
      message: '跑步日期時間不能晚於目前時間',
    }
  }

  if (typeof distance !== 'number' || !Number.isFinite(distance) || distance <= 0) {
    return {
      isValid: false,
      message: '跑步距離必須大於 0',
    }
  }

  if (
    typeof duration !== 'number' ||
    !Number.isInteger(duration) ||
    duration <= 0
  ) {
    return {
      isValid: false,
      message: '跑步時長必須是大於 0 的整數秒數',
    }
  }

  if (!isAllowedValue(RUN_LOCATION_TYPES, locationType)) {
    return {
      isValid: false,
      message: '跑步地點類型不正確',
    }
  }

  if (!isAllowedValue(RUN_MOODS, mood)) {
    return {
      isValid: false,
      message: '跑步心情選項不正確',
    }
  }

  if (!isRecord(weather)) {
    return {
      isValid: false,
      message: '天氣資料格式不正確',
    }
  }

  if (!isAllowedValue(WEATHER_CONDITIONS, weather.condition)) {
    return {
      isValid: false,
      message: '天氣選項不正確',
    }
  }

  if (!isAllowedValue(WEATHER_SOURCES, weather.source)) {
    return {
      isValid: false,
      message: '天氣資料來源不正確',
    }
  }

  const normalizedImages = images === undefined ? [] : images

  if (!Array.isArray(normalizedImages)) {
    return {
      isValid: false,
      message: '跑步照片資料格式不正確',
    }
  }

  if (normalizedImages.length > 1) {
    return {
      isValid: false,
      message: '第一版每筆跑步紀錄最多上傳一張照片',
    }
  }

  if (
    !normalizedImages.every(
      (image) => typeof image === 'string' && isCloudinaryImageUrl(image),
    )
  ) {
    return {
      isValid: false,
      message: '跑步照片網址格式不正確',
    }
  }

  const normalizedMissionId =
    typeof missionId === 'string' ? missionId.trim() : ''

  if (
    missionId !== undefined &&
    normalizedMissionId !== '' &&
    !isValidObjectId(normalizedMissionId)
  ) {
    return {
      isValid: false,
      message: '任務 ID 格式不正確',
    }
  }

  return {
    isValid: true,
    data: {
      runDate: parsedRunDate,
      distance,
      duration,
      locationType,
      mood,
      weather: {
        condition: weather.condition,
        source: weather.source,
      },
      images: normalizedImages,
      ...(normalizedMissionId
        ? {
            missionId: normalizedMissionId,
          }
        : {}),
    },
  }
}

export const registerRunRecordHandlers = (router: Router) => {
  // 建立跑步紀錄
  router.post('/', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const validationResult = validateRunRecordFormData(req.body)

      if (!validationResult.isValid) {
        res.status(400).json({
          message: validationResult.message,
        })
        return
      }

      const userExists = await User.exists({
        _id: req.user.userId,
      })

      if (!userExists) {
        res.status(404).json({
          message: '找不到使用者',
        })
        return
      }

      const runRecord = await RunRecord.create({
        user: req.user.userId,
        runDate: validationResult.data.runDate,
        distance: validationResult.data.distance,
        duration: validationResult.data.duration,
        locationType: validationResult.data.locationType,
        mood: validationResult.data.mood,
        weather: validationResult.data.weather,
        images: validationResult.data.images,
        ...(validationResult.data.missionId
          ? {
              missionId: validationResult.data.missionId,
            }
          : {}),
      })
      const newBadges = await unlockEligibleBadges(req.user.userId)
      const progression = await refreshRunnerProgress(req.user.userId)

      res.status(201).json({
        message: '跑步紀錄建立成功',
        runRecord: {
          id: runRecord._id,
          runDate: runRecord.runDate,
          distance: runRecord.distance,
          duration: runRecord.duration,
          locationType: runRecord.locationType,
          mood: runRecord.mood,
          weather: runRecord.weather,
          images: runRecord.images,
          missionId: runRecord.missionId,
          createdAt: runRecord.createdAt,
          updatedAt: runRecord.updatedAt,
        },
        progression: createProgressionResponse(newBadges, progression),
      })
    } catch (error: unknown) {
      console.error('Failed to create run record:', error)

      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          message: '跑步紀錄資料驗證失敗',
        })
        return
      }

      res.status(500).json({
        message: '建立跑步紀錄失敗',
      })
    }
  })

  // 更新目前玩家自己的跑步紀錄
  router.patch('/:id', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { id } = req.params

      if (!isValidObjectId(id)) {
        res.status(400).json({
          message: '跑步紀錄 ID 格式不正確',
        })
        return
      }

      const validationResult = validateRunRecordFormData(req.body)

      if (!validationResult.isValid) {
        res.status(400).json({
          message: validationResult.message,
        })
        return
      }

      const runRecord = await RunRecord.findOneAndUpdate(
        {
          _id: id,
          user: req.user.userId,
        },
        {
          $set: {
            runDate: validationResult.data.runDate,
            distance: validationResult.data.distance,
            duration: validationResult.data.duration,
            locationType: validationResult.data.locationType,
            mood: validationResult.data.mood,
            weather: validationResult.data.weather,
            images: validationResult.data.images,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )

      if (!runRecord) {
        res.status(404).json({
          message: '找不到跑步紀錄',
        })
        return
      }

      const newBadges = await unlockEligibleBadges(req.user.userId)
      const progression = await refreshRunnerProgress(req.user.userId)

      res.status(200).json({
        message: '跑步紀錄更新成功',
        runRecord: {
          id: runRecord._id,
          runDate: runRecord.runDate,
          distance: runRecord.distance,
          duration: runRecord.duration,
          locationType: runRecord.locationType,
          mood: runRecord.mood,
          weather: runRecord.weather,
          images: runRecord.images,
          missionId: runRecord.missionId,
          createdAt: runRecord.createdAt,
          updatedAt: runRecord.updatedAt,
        },
        progression: createProgressionResponse(newBadges, progression),
      })
    } catch (error: unknown) {
      console.error('Failed to update run record:', error)

      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          message: '跑步紀錄資料驗證失敗',
        })
        return
      }

      res.status(500).json({
        message: '更新跑步紀錄失敗',
      })
    }
  })

  // 刪除目前玩家自己的跑步紀錄
  router.delete('/:id', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { id } = req.params

      if (!isValidObjectId(id)) {
        res.status(400).json({
          message: '跑步紀錄 ID 格式不正確',
        })
        return
      }

      const runRecord = await RunRecord.findOneAndDelete({
        _id: id,
        user: req.user.userId,
      })

      if (!runRecord) {
        res.status(404).json({
          message: '找不到跑步紀錄',
        })
        return
      }

      res.status(200).json({
        message: '跑步紀錄刪除成功',
      })
    } catch (error: unknown) {
      console.error('Failed to delete run record:', error)

      res.status(500).json({
        message: '刪除跑步紀錄失敗',
      })
    }
  })

  // 取得目前玩家指定日期範圍內的紀錄
  router.get('/', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const { start, end } = req.query

      if (typeof start !== 'string' || typeof end !== 'string') {
        res.status(400).json({
          message: '請提供查詢開始與結束時間',
        })
        return
      }

      const startDate = new Date(start)
      const endDate = new Date(end)

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        res.status(400).json({
          message: '查詢日期格式不正確',
        })
        return
      }

      const queryRange = endDate.getTime() - startDate.getTime()

      if (queryRange <= 0) {
        res.status(400).json({
          message: '查詢結束時間必須晚於開始時間',
        })
        return
      }

      if (queryRange > maximumQueryRangeInMilliseconds) {
        res.status(400).json({
          message: '每次最多查詢一個月份的跑步紀錄',
        })
        return
      }

      const runRecords = await RunRecord.find({
        user: req.user.userId,
        runDate: {
          $gte: startDate,
          $lt: endDate,
        },
      })
        .select(
          '_id runDate distance duration locationType mood weather images missionId createdAt updatedAt',
        )
        .sort({
          runDate: 1,
        })
        .lean()

      res.status(200).json({
        message: '取得跑步紀錄成功',
        runRecords: runRecords.map((runRecord) => ({
          id: runRecord._id,
          runDate: runRecord.runDate,
          distance: runRecord.distance,
          duration: runRecord.duration,
          locationType: runRecord.locationType,
          mood: runRecord.mood,
          weather: runRecord.weather,
          images: runRecord.images,
          missionId: runRecord.missionId,
          createdAt: runRecord.createdAt,
          updatedAt: runRecord.updatedAt,
        })),
      })
    } catch (error: unknown) {
      console.error('Failed to get run records:', error)

      res.status(500).json({
        message: '取得跑步紀錄失敗',
      })
    }
  })
}
