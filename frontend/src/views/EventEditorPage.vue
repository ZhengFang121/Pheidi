<template>
  <section class="layout-container event-editor-page">
    <BaseButton :label="backLabel" variant="outline" class="back-button" @click="goBack">
      <template #icon>
        <ArrowLeft aria-hidden="true" />
      </template>
    </BaseButton>

    <header class="page-heading">
      <h1>{{ isEditMode ? '編輯活動' : '發起活動' }}</h1>
      <p>
        {{
          isEditMode
            ? '更新活動內容，讓參加的跑友掌握最新資訊。'
            : '建立一場跑步活動，邀請廣場上的跑友一起出發。'
        }}
      </p>
    </header>

    <BaseCard v-if="isLoading" class="editor-loading" aria-busy="true" aria-live="polite">
      <Skeleton width="12rem" height="2rem" />
      <Skeleton v-for="index in 6" :key="index" height="3.5rem" />
    </BaseCard>

    <BaseCard v-else-if="loadError" class="editor-state" role="status">
      <CalendarDays class="state-icon" aria-hidden="true" />
      <h2>{{ loadError }}</h2>
      <p>請返回活動情報，或稍後再試。</p>
      <BaseButton label="返回活動情報" variant="outline" @click="returnToEvents" />
    </BaseCard>

    <EventForm
      v-else-if="!isEditMode || initialEvent"
      :initial-event="initialEvent ?? undefined"
      :is-submitting="isSubmitting"
      :error-message="submitError"
      @submit="handleSubmit"
      @cancel="goBack"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowLeft, CalendarDays } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'

import Skeleton from 'primevue/skeleton'

import EventForm from '@/components/events/EventForm.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { createEvent, getEventById, updateEvent } from '@/services/events'
import { useAuthStore } from '@/stores/auth'
import type { EventFormPayload, RunningEvent } from '@/types/event'
import { getApiErrorMessage, hasApiErrorStatus } from '@/utils/apiError'

const props = defineProps<{
  mode: 'create' | 'edit'
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const initialEvent = ref<RunningEvent | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref('')
const submitError = ref('')
let requestSequence = 0

const isEditMode = computed(() => props.mode === 'edit')
const backLabel = computed(() => (isEditMode.value ? '返回活動詳情' : '返回活動情報'))

const getEventId = () => {
  const eventId = route.params.eventId

  return Array.isArray(eventId) ? (eventId[0] ?? '') : (eventId ?? '')
}

const returnToEvents = () => {
  void router.push({ name: 'plaza', query: { tab: 'events' } })
}

const goBack = () => {
  const eventId = getEventId()

  if (isEditMode.value && eventId) {
    void router.push({ name: 'event-detail', params: { eventId } })
    return
  }

  returnToEvents()
}

const loadEvent = async () => {
  const currentRequest = ++requestSequence

  initialEvent.value = null
  loadError.value = ''
  submitError.value = ''

  if (!isEditMode.value) {
    isLoading.value = false
    return
  }

  const eventId = getEventId()

  if (!eventId) {
    loadError.value = '找不到這個活動'
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    const response = await getEventById(eventId)

    if (currentRequest !== requestSequence) return

    const canManage = authStore.isAdmin || response.event.createdBy.id === authStore.user?.id

    if (!canManage) {
      loadError.value = '你沒有權限編輯這個活動'
      return
    }

    initialEvent.value = response.event
  } catch (error: unknown) {
    if (currentRequest !== requestSequence) return

    loadError.value = hasApiErrorStatus(error, 404)
      ? '找不到這個活動'
      : getApiErrorMessage(error, '活動資料載入失敗')
  } finally {
    if (currentRequest === requestSequence) isLoading.value = false
  }
}

const handleSubmit = async (payload: EventFormPayload) => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = isEditMode.value
      ? await updateEvent(getEventId(), payload)
      : await createEvent(payload)

    await router.push({
      name: 'event-detail',
      params: { eventId: response.event.id },
    })
  } catch (error: unknown) {
    submitError.value = getApiErrorMessage(
      error,
      isEditMode.value ? '更新活動失敗，請稍後再試。' : '建立活動失敗，請稍後再試。',
    )
  } finally {
    isSubmitting.value = false
  }
}

watch([() => props.mode, () => route.params.eventId], loadEvent, { immediate: true })

onBeforeUnmount(() => {
  requestSequence += 1
})
</script>

<style scoped>
.event-editor-page {
  display: flex;
  max-width: 68rem;
  flex-direction: column;
  gap: var(--space-5);

  padding-block: var(--space-7) var(--space-8);
}

.back-button {
  align-self: flex-start;
}

.back-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.page-heading {
  max-width: 46rem;
}

.page-heading h1 {
  margin: 0 0 var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
}

.page-heading p {
  margin: 0;

  color: var(--color-text-secondary);
}

.editor-loading,
.editor-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  padding: var(--space-6);

  background: var(--color-primary-pale);
  border-radius: var(--radius-xl);
}

.editor-state {
  align-items: center;
  padding-block: var(--space-8);
  text-align: center;
}

.editor-state h2,
.editor-state p {
  margin: 0;
}

.editor-state h2 {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.editor-state p {
  color: var(--color-text-secondary);
}

.state-icon {
  width: 48px;
  height: 48px;

  color: var(--color-primary);
  stroke-width: 1.6;
}

@media (max-width: 640px) {
  .event-editor-page {
    gap: var(--space-4);
    padding-block: var(--space-5) var(--space-7);
  }

  .page-heading h1 {
    font-size: var(--font-size-lg);
  }
}
</style>
