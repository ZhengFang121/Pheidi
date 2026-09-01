import { computed, nextTick, readonly, ref } from 'vue'

import type { ProgressionEvent } from '@/types/progressionEvent'
import type { RunRecordProgression } from '@/types/runnerProgress'

interface QueuedProgressionEvent {
  id: number
  event: ProgressionEvent
  badgeIndex?: number
  badgeTotal?: number
}

const eventQueue = ref<QueuedProgressionEvent[]>([])

let nextEventId = 1
let returnFocusTarget: HTMLElement | null = null

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
      toLevel: levelUp.to,
      toName: levelUp.name,
    })
  }

  return events
}

export const useProgressionEvents = () => {
  const enqueueProgressionEvents = (events: ProgressionEvent[]) => {
    if (!events.length) return

    if (!eventQueue.value.length) {
      returnFocusTarget =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    }

    const badgeTotal = events.filter((event) => event.type === 'badge').length
    let badgeIndex = 0

    const queuedEvents = events.map<QueuedProgressionEvent>((event) => {
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
      }
    })

    eventQueue.value.push(...queuedEvents)
  }

  const advanceProgressionEvent = () => {
    eventQueue.value.shift()

    if (!eventQueue.value.length) {
      void restoreFocus()
    }
  }

  return {
    currentQueueItem: readonly(currentQueueItem),
    isProgressionActive: readonly(isProgressionActive),
    hasFollowingEvent: computed(() => eventQueue.value.length > 1),
    enqueueProgressionEvents,
    advanceProgressionEvent,
  }
}
