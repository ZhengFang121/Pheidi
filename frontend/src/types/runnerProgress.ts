export type RunnerLevel = 1 | 2 | 3 | 4 | 5

export type BadgeCategory =
  'milestone' | 'distance' | 'time' | 'location' | 'weather' | 'mood' | 'memory' | 'consistency'

export interface BadgeDefinition {
  key: string
  name: string
  description: string
  category: BadgeCategory
}

export interface UnlockedBadge extends BadgeDefinition {
  unlockedAt: string
}

export interface RunnerStats {
  runCount: number
  totalDistance: number
  distinctLocationCount: number
  badgeCount: number
  completedPheidiMissionCount: number
}

export interface NumericRequirementProgress {
  current: number
  required: number
  isMet: boolean
}

export interface RunnerLevelRequirements {
  runCount?: NumericRequirementProgress
  totalDistance?: NumericRequirementProgress
  distinctLocationCount?: NumericRequirementProgress
  badgeCount?: NumericRequirementProgress
  pheidiMission?: NumericRequirementProgress
}

export interface RunnerNextLevel {
  level: RunnerLevel
  name: string
  requirements: RunnerLevelRequirements
}

export interface RunnerProgress {
  currentLevel: {
    level: RunnerLevel
    name: string
  }
  stats: RunnerStats
  badges: UnlockedBadge[]
  badgeDefinitions: BadgeDefinition[]
  nextLevel: RunnerNextLevel | null
  pheidiMissionEligible: boolean
}

export interface GetRunnerProgressResponse {
  message: string
  runnerProgress: RunnerProgress
}

export interface RunRecordProgression {
  newBadges: UnlockedBadge[]
  levelUp: {
    from: RunnerLevel
    to: RunnerLevel
    name: string
  } | null
  currentLevel: RunnerLevel
  pheidiMissionEligible: boolean
}
