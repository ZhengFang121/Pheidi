import type { Router } from 'express'

import { BADGE_DEFINITIONS, BADGE_DEFINITION_BY_KEY } from '../constants/badges.js'
import { getRunnerLevelDefinition } from '../constants/runnerLevels.js'
import User from '../models/User.js'
import UserBadge from '../models/UserBadge.js'
import { unlockEligibleBadges } from '../services/badgeService.js'
import { getNextLevelProgress, refreshRunnerProgress } from '../services/runnerProgressService.js'

export const registerRunnerProgressHandlers = (router: Router) => {
  // 取得目前玩家的等級、統計與徽章進度
  router.get('/', async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: '請先登入',
        })
        return
      }

      const userExists = await User.exists({ _id: req.user.userId })

      if (!userExists) {
        res.status(404).json({
          message: '找不到使用者',
        })
        return
      }

      // 也讓功能上線前已存在的 RunRecord 可補發永久徽章。
      await unlockEligibleBadges(req.user.userId)

      const progression = await refreshRunnerProgress(req.user.userId)
      const userBadges = await UserBadge.find({ user: req.user.userId })
        .select('badgeKey unlockedAt')
        .sort({ unlockedAt: 1, _id: 1 })
        .lean()
      const currentLevel = getRunnerLevelDefinition(progression.currentLevel)

      res.status(200).json({
        message: '取得玩家進度成功',
        runnerProgress: {
          currentLevel: {
            level: currentLevel.level,
            name: currentLevel.name,
          },
          stats: progression.stats,
          badges: userBadges.map((userBadge) => {
            const definition = BADGE_DEFINITION_BY_KEY.get(userBadge.badgeKey)

            return {
              key: userBadge.badgeKey,
              name: definition?.name ?? userBadge.badgeKey,
              description: definition?.description ?? '',
              category: definition?.category ?? 'milestone',
              unlockedAt: userBadge.unlockedAt,
            }
          }),
          badgeDefinitions: BADGE_DEFINITIONS,
          nextLevel: getNextLevelProgress(progression.currentLevel, progression.stats),
          pheidiMissionEligible: progression.pheidiMissionEligible,
        },
      })
    } catch (error: unknown) {
      console.error('Failed to get runner progress:', error)

      res.status(500).json({
        message: '取得玩家進度失敗',
      })
    }
  })
}
