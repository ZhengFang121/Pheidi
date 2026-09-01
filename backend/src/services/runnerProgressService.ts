import { Types } from 'mongoose'

import { resolveBadgeKey } from '../constants/badges.js'
import { RUNNER_LEVELS, type RunnerLevel } from '../constants/runnerLevels.js'
import RunRecord from '../models/RunRecord.js'
import RunnerProgress from '../models/RunnerProgress.js'
import UserBadge from '../models/UserBadge.js'
import type { RunnerProgressRefreshResult, RunnerStats } from '../types/runnerProgress.js'
import { isDuplicateKeyError } from '../utils/mongoose.js'

interface RunStatsAggregationResult {
  runCount: number
  totalDistance: number
  distinctLocationCount: number
  completedPheidiMissionCount: number
}

export const calculateHighestEligibleLevel = (stats: RunnerStats): RunnerLevel => {
  if (
    stats.runCount >= 50 &&
    stats.totalDistance >= 250 &&
    stats.completedPheidiMissionCount >= 1
  ) {
    return 5
  }

  if (stats.runCount >= 25 && stats.totalDistance >= 100 && stats.badgeCount >= 10) {
    return 4
  }

  if (stats.runCount >= 10 && stats.totalDistance >= 30 && stats.distinctLocationCount >= 3) {
    return 3
  }

  if (stats.runCount >= 5 && stats.totalDistance >= 10) {
    return 2
  }

  return 1
}

export const isPheidiMissionEligible = (stats: RunnerStats) => {
  return stats.runCount >= 50 && stats.totalDistance >= 250
}

export const calculateLevelAfterRefresh = (
  currentLevel: RunnerLevel,
  stats: RunnerStats,
): RunnerLevel => {
  const eligibleLevel = calculateHighestEligibleLevel(stats)

  return Math.max(currentLevel, eligibleLevel) as RunnerLevel
}

export const getRunnerStats = async (userId: string): Promise<RunnerStats> => {
  const userObjectId = new Types.ObjectId(userId)
  const [runStatsResults, storedBadges] = await Promise.all([
    RunRecord.aggregate<RunStatsAggregationResult>([
      {
        $match: {
          user: userObjectId,
        },
      },
      {
        $group: {
          _id: null,
          runCount: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          locationTypes: { $addToSet: '$locationType' },
          completedPheidiMissionIds: { $addToSet: '$missionId' },
        },
      },
      {
        $project: {
          _id: 0,
          runCount: 1,
          totalDistance: 1,
          distinctLocationCount: { $size: '$locationTypes' },
          completedPheidiMissionCount: {
            $size: {
              $filter: {
                input: '$completedPheidiMissionIds',
                as: 'missionId',
                cond: { $ne: ['$$missionId', null] },
              },
            },
          },
        },
      },
    ]),
    UserBadge.find({ user: userObjectId }).select('badgeKey').lean(),
  ])
  const runStats = runStatsResults[0]
  const badgeCount = new Set(
    storedBadges.map(({ badgeKey }) => resolveBadgeKey(badgeKey)).filter(Boolean),
  ).size

  return {
    runCount: runStats?.runCount ?? 0,
    totalDistance: runStats?.totalDistance ?? 0,
    distinctLocationCount: runStats?.distinctLocationCount ?? 0,
    badgeCount,
    completedPheidiMissionCount: runStats?.completedPheidiMissionCount ?? 0,
  }
}

export const ensureRunnerProgress = async (userId: string) => {
  try {
    await RunnerProgress.updateOne(
      {
        user: userId,
      },
      {
        $setOnInsert: {
          user: userId,
          currentLevel: 1,
        },
      },
      {
        upsert: true,
      },
    )
  } catch (error: unknown) {
    if (!isDuplicateKeyError(error)) {
      throw error
    }
  }

  const runnerProgress = await RunnerProgress.findOne({ user: userId })

  if (!runnerProgress) {
    throw new Error('無法建立玩家等級進度')
  }

  return runnerProgress
}

export const refreshRunnerProgress = async (
  userId: string,
): Promise<RunnerProgressRefreshResult> => {
  const existingProgress = await ensureRunnerProgress(userId)
  const previousLevel = existingProgress.currentLevel
  const stats = await getRunnerStats(userId)
  const eligibleLevel = calculateLevelAfterRefresh(previousLevel, stats)
  let currentLevel = previousLevel
  let levelUp: RunnerProgressRefreshResult['levelUp'] = null

  if (eligibleLevel > previousLevel) {
    const upgradedProgress = await RunnerProgress.findOneAndUpdate(
      {
        user: userId,
        currentLevel: {
          $lt: eligibleLevel,
        },
      },
      {
        $max: {
          currentLevel: eligibleLevel,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (upgradedProgress) {
      currentLevel = upgradedProgress.currentLevel
      levelUp = {
        from: previousLevel,
        to: upgradedProgress.currentLevel,
      }
    } else {
      const latestProgress = await RunnerProgress.findOne({ user: userId })

      if (!latestProgress) {
        throw new Error('找不到玩家等級進度')
      }

      currentLevel = latestProgress.currentLevel
    }
  }

  return {
    previousLevel,
    currentLevel,
    levelUp,
    stats,
    pheidiMissionEligible: isPheidiMissionEligible(stats),
  }
}

export const getNextLevelProgress = (currentLevel: RunnerLevel, stats: RunnerStats) => {
  const nextLevel = RUNNER_LEVELS.find(({ level }) => level === currentLevel + 1)

  if (!nextLevel) {
    return null
  }

  const requirements = nextLevel.requirements
  const createNumericProgress = (current: number, required: number) => ({
    current,
    required,
    isMet: current >= required,
  })

  return {
    level: nextLevel.level,
    name: nextLevel.name,
    requirements: {
      ...('runCount' in requirements
        ? {
            runCount: createNumericProgress(stats.runCount, requirements.runCount),
          }
        : {}),
      ...('totalDistance' in requirements
        ? {
            totalDistance: createNumericProgress(stats.totalDistance, requirements.totalDistance),
          }
        : {}),
      ...('distinctLocationCount' in requirements
        ? {
            distinctLocationCount: createNumericProgress(
              stats.distinctLocationCount,
              requirements.distinctLocationCount,
            ),
          }
        : {}),
      ...('badgeCount' in requirements
        ? {
            badgeCount: createNumericProgress(stats.badgeCount, requirements.badgeCount),
          }
        : {}),
      ...('requiresPheidiMission' in requirements
        ? {
            pheidiMission: createNumericProgress(stats.completedPheidiMissionCount, 1),
          }
        : {}),
    },
  }
}
