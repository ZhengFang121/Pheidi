<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

import ProgressionEventOverlay from '@/components/progression/ProgressionEventOverlay.vue'
import { useProgressionEvents } from '@/composables/useProgressionEvents'

const { currentQueueItem, hasFollowingEvent, advanceProgressionEvent, clearProgressionEvents } =
  useProgressionEvents()

onBeforeUnmount(clearProgressionEvents)
</script>

<template>
  <ProgressionEventOverlay
    v-if="currentQueueItem"
    :event="currentQueueItem.event"
    :event-key="currentQueueItem.id"
    :badge-index="currentQueueItem.badgeIndex"
    :badge-total="currentQueueItem.badgeTotal"
    :has-following-event="hasFollowingEvent"
    @continue="advanceProgressionEvent"
    @error="clearProgressionEvents"
  />
</template>
