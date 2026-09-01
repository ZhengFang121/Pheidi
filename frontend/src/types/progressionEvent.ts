import type { RunnerLevel } from '@/types/runnerProgress'

export interface BadgeProgressionEvent {
  type: 'badge'
  badgeKey: string
  name: string
  description: string
  imagePath: string
}

export interface LevelProgressionEvent {
  type: 'level'
  fromLevel: RunnerLevel
  fromName?: string
  toLevel: RunnerLevel
  toName: string
  description?: string
}

export type ProgressionEvent = BadgeProgressionEvent | LevelProgressionEvent
