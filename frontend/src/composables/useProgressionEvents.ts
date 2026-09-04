import { computed, nextTick, readonly, ref } from 'vue'

import type { ProgressionEvent } from '@/types/progressionEvent'
import type { RunnerLevel, RunRecordProgression } from '@/types/runnerProgress'

interface QueuedProgressionEvent {
  id: number
  event: ProgressionEvent
  badgeIndex?: number
  badgeTotal?: number
  completeBatch?: () => void
}

const eventQueue = ref<QueuedProgressionEvent[]>([])

let nextEventId = 1
let returnFocusTarget: HTMLElement | null = null

const runnerLevelNames: Record<RunnerLevel, string> = {
  1: '啟程者',
  2: '習跑者',
  3: '冒險者',
  4: '挑戰者',
  5: '菲迪同行者',
}

const currentQueueItem = computed(() => eventQueue.value[0] ?? null)
const isProgressionActive = computed(() => currentQueueItem.value !== null)

const restoreFocus = async () => {
  await nextTick()

  const focusTarget = returnFocusTarget?.isConnected
    ? returnFocusTarget
    : document.querySelector<HTMLElement>('[data-progression-return-focus]')

  focusTarget?.focus()
  returnFocusTarget = null
}

export const toProgressionEvents = ({
  newBadges,
  levelUp,
}: RunRecordProgression): ProgressionEvent[] => {
  const events: ProgressionEvent[] = newBadges.map((badge) => ({
    type: 'badge',
    badgeKey: badge.key,
    name: badge.name,
    description: badge.description,
    imagePath: badge.imagePath,
  }))

  if (levelUp) {
    events.push({
      type: 'level',
      fromLevel: levelUp.from,
      fromName: runnerLevelNames[levelUp.from],
      toLevel: levelUp.to,
      toName: levelUp.name,
    })
  }

  return events
}

export const useProgressionEvents = () => {
  const enqueueProgressionEvents = (events: ProgressionEvent[]): Promise<void> => {
    if (!events.length) return Promise.resolve()

    if (!eventQueue.value.length) {
      returnFocusTarget =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    }

    const badgeTotal = events.filter((event) => event.type === 'badge').length
    let badgeIndex = 0

    return new Promise((resolve) => {
      const queuedEvents = events.map<QueuedProgressionEvent>((event, index) => {
        if (event.type === 'badge') badgeIndex += 1

        return {
          id: nextEventId++,
          event,
          ...(event.type === 'badge' && badgeTotal > 1
            ? {
                badgeIndex,
                badgeTotal,
              }
            : {}),
          ...(index === events.length - 1 ? { completeBatch: resolve } : {}),
        }
      })

      eventQueue.value.push(...queuedEvents)
    })
  }

  const advanceProgressionEvent = () => {
    const completedEvent = eventQueue.value.shift()
    completedEvent?.completeBatch?.()

    if (!eventQueue.value.length) {
      void restoreFocus()
    }
  }

  const clearProgressionEvents = () => {
    const completeBatches = eventQueue.value.flatMap(({ completeBatch }) =>
      completeBatch ? [completeBatch] : [],
    )

    eventQueue.value = []
    completeBatches.forEach((completeBatch) => completeBatch())
    void restoreFocus()
  }

  return {
    currentQueueItem: readonly(currentQueueItem),
    isProgressionActive: readonly(isProgressionActive),
    hasFollowingEvent: computed(() => eventQueue.value.length > 1),
    enqueueProgressionEvents,
    advanceProgressionEvent,
    clearProgressionEvents,
  }
}
