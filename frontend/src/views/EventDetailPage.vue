<template>
  <section class="layout-container event-detail-page">
    <ConfirmDialog />

    <BaseButton label="返回活動情報" variant="outline" class="back-button" @click="returnToEvents">
      <template #icon>
        <ArrowLeft aria-hidden="true" />
      </template>
    </BaseButton>

    <div
      v-if="isLoading"
      class="event-detail-loading"
      aria-label="活動詳情載入中"
      aria-live="polite"
      aria-busy="true"
    >
      <BaseCard class="event-detail-card event-detail-skeleton">
        <div class="event-hero">
          <Skeleton width="5rem" height="5.5rem" border-radius="var(--radius-md)" />
          <div class="event-hero-content">
            <Skeleton width="7rem" height="1.5rem" />
            <Skeleton width="min(28rem, 90%)" height="2.5rem" />
            <Skeleton width="min(38rem, 100%)" height="1.25rem" />
          </div>
        </div>
        <div class="skeleton-info-grid">
          <Skeleton v-for="index in 6" :key="index" height="3.5rem" />
        </div>
        <div class="skeleton-content">
          <Skeleton width="8rem" height="2rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="92%" height="1rem" />
          <Skeleton width="76%" height="1rem" />
        </div>
      </BaseCard>
    </div>

    <BaseCard v-else-if="errorState" class="event-state-card" role="status">
      <CalendarDays class="event-state-icon" aria-hidden="true" />
      <h1>{{ errorState === 'not-found' ? '找不到這個活動' : '活動資料載入失敗' }}</h1>
      <p>
        {{
          errorState === 'not-found'
            ? '這個活動可能已被移除，或活動網址不正確。'
            : '目前無法取得活動內容，請稍後再試。'
        }}
      </p>
      <div class="event-state-actions">
        <BaseButton
          v-if="errorState === 'load-failed'"
          label="重新載入"
          variant="secondary"
          @click="loadEvent"
        />
        <BaseButton label="返回活動情報" variant="outline" @click="returnToEvents" />
      </div>
    </BaseCard>

    <BaseCard v-else-if="event" as="article" class="event-detail-card">
      <header class="event-hero">
        <div class="event-date" aria-hidden="true">
          <span>{{ eventMonth }}</span>
          <strong>{{ eventDay }}</strong>
        </div>

        <div class="event-hero-content">
          <div class="event-meta-row">
            <time :datetime="event.startAt">{{ eventLongDate }}</time>
            <Tag :value="statusPresentation.label" :severity="statusPresentation.severity" />
            <Tag v-if="event.isParticipant" value="已參加" severity="success" />
          </div>
          <h1 ref="titleHeading" tabindex="-1">{{ event.title }}</h1>
          <p>{{ event.summary }}</p>
        </div>
      </header>

      <div v-if="canManageEvent" class="event-management-actions" aria-label="活動管理">
        <BaseButton label="編輯活動" variant="outline" @click="editEvent">
          <template #icon>
            <Pencil aria-hidden="true" />
          </template>
        </BaseButton>
        <Button
          type="button"
          label="刪除活動"
          severity="danger"
          outlined
          :loading="isDeleting"
          :disabled="isDeleting || isParticipationPending"
          @click="confirmDeleteEvent"
        >
          <template #icon>
            <Trash2 aria-hidden="true" />
          </template>
        </Button>
      </div>

      <section class="event-section" aria-labelledby="event-information-heading">
        <h2 id="event-information-heading">活動資訊</h2>
        <dl class="event-info-grid">
          <div class="event-info-item">
            <dt><MapPin aria-hidden="true" />地點</dt>
            <dd>{{ event.location }}</dd>
          </div>
          <div class="event-info-item">
            <dt><CalendarDays aria-hidden="true" />日期</dt>
            <dd>{{ eventLongDate }}</dd>
          </div>
          <div class="event-info-item">
            <dt><Clock aria-hidden="true" />活動時間</dt>
            <dd>{{ eventTimeRange }}</dd>
          </div>
          <div class="event-info-item">
            <dt><RouteIcon aria-hidden="true" />距離</dt>
            <dd>{{ event.distance }}</dd>
          </div>
          <div class="event-info-item">
            <dt><UserRound aria-hidden="true" />發起人</dt>
            <dd>{{ event.createdBy.username }}</dd>
          </div>
          <div class="event-info-item">
            <dt><UsersRound aria-hidden="true" />參加人數</dt>
            <dd>{{ participantLabel }}</dd>
          </div>
        </dl>
      </section>

      <section class="event-section" aria-labelledby="event-content-heading">
        <h2 id="event-content-heading">活動介紹</h2>
        <p class="event-long-content">{{ event.content || event.summary }}</p>
      </section>

      <section
        v-if="event.notes.length"
        class="event-section"
        aria-labelledby="event-notes-heading"
      >
        <h2 id="event-notes-heading">活動提醒</h2>
        <ul class="event-notes">
          <li v-for="note in event.notes" :key="note">{{ note }}</li>
        </ul>
      </section>

      <Message v-if="actionError" severity="error" :closable="false" role="alert">
        {{ actionError }}
      </Message>

      <footer class="event-cta">
        <div>
          <h2>{{ participationHeading }}</h2>
          <p>{{ participationDescription }}</p>
        </div>

        <BaseButton
          v-if="event.status === 'ended'"
          label="活動已結束"
          disabled
          class="participation-button"
        />
        <BaseButton
          v-else-if="event.isParticipant"
          label="取消參加"
          variant="secondary"
          :loading="isParticipationPending"
          :disabled="isParticipationPending || isDeleting"
          class="participation-button"
          @click="leaveCurrentEvent"
        />
        <BaseButton
          v-else-if="event.status === 'full'"
          label="活動已額滿"
          disabled
          class="participation-button"
        />
        <BaseButton
          v-else
          label="參加活動"
          :loading="isParticipationPending"
          :disabled="isParticipationPending || isDeleting"
          class="participation-button"
          @click="joinCurrentEvent"
        >
          <template #icon>
            <UserPlus aria-hidden="true" />
          </template>
        </BaseButton>
      </footer>
    </BaseCard>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Route as RouteIcon,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
} from '@lucide/vue'

import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { deleteEvent, getEventById, joinEvent, leaveEvent } from '@/services/events'
import { useAuthStore } from '@/stores/auth'
import type { RunningEvent } from '@/types/event'
import {
  formatEventDay,
  formatEventLongDate,
  formatEventMonth,
  formatEventTimeRange,
} from '@/utils/date'
import { formatEventParticipantCount, getEventStatusPresentation } from '@/utils/event'
import { getApiErrorMessage, hasApiErrorStatus } from '@/utils/apiError'

type ErrorState = 'not-found' | 'load-failed' | null

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const confirm = useConfirm()

const event = ref<RunningEvent | null>(null)
const isLoading = ref(true)
const isParticipationPending = ref(false)
const isDeleting = ref(false)
const errorState = ref<ErrorState>(null)
const actionError = ref('')
const titleHeading = ref<HTMLHeadingElement | null>(null)
let requestSequence = 0

const eventMonth = computed(() => (event.value ? formatEventMonth(event.value.startAt) : ''))
const eventDay = computed(() => (event.value ? formatEventDay(event.value.startAt) : ''))
const eventLongDate = computed(() => (event.value ? formatEventLongDate(event.value.startAt) : ''))
const eventTimeRange = computed(() =>
  event.value ? formatEventTimeRange(event.value.startAt, event.value.endAt) : '',
)
const statusPresentation = computed(() =>
  getEventStatusPresentation(event.value?.status ?? 'ended'),
)
const participantLabel = computed(() =>
  event.value
    ? formatEventParticipantCount(event.value.participantCount, event.value.capacity)
    : '',
)
const canManageEvent = computed(
  () => authStore.isAdmin || event.value?.createdBy.id === authStore.user?.id,
)
const participationHeading = computed(() => {
  if (!event.value) return ''
  if (event.value.status === 'ended') return '這場活動已經結束'
  if (event.value.isParticipant) return '你已參加這場活動'
  if (event.value.status === 'full') return '這場活動已經額滿'

  return '準備好一起出發了嗎？'
})
const participationDescription = computed(() => {
  if (!event.value) return ''
  if (event.value.status === 'ended') return '期待在下一場跑友活動再見。'
  if (event.value.isParticipant) return '若行程有變，仍可在活動開始前取消參加。'
  if (event.value.status === 'full') return '目前沒有可用名額，請留意參加人數是否有變動。'

  return `目前${participantLabel.value}，歡迎加入跑友的行列。`
})

const getEventId = () => {
  const eventId = route.params.eventId

  return Array.isArray(eventId) ? (eventId[0] ?? '') : (eventId ?? '')
}

async function loadEvent() {
  const currentRequest = ++requestSequence

  event.value = null
  errorState.value = null
  actionError.value = ''
  isLoading.value = true

  try {
    const response = await getEventById(getEventId())

    if (currentRequest !== requestSequence) return

    event.value = response.event
    await nextTick()
    titleHeading.value?.focus()
  } catch (error: unknown) {
    if (currentRequest !== requestSequence) return

    errorState.value = hasApiErrorStatus(error, 404) ? 'not-found' : 'load-failed'
  } finally {
    if (currentRequest === requestSequence) isLoading.value = false
  }
}

async function joinCurrentEvent() {
  if (!event.value || isParticipationPending.value) return

  actionError.value = ''
  isParticipationPending.value = true

  try {
    const response = await joinEvent(event.value.id)
    event.value = response.event
  } catch (error: unknown) {
    actionError.value = getApiErrorMessage(error, '參加活動失敗，請稍後再試。')
  } finally {
    isParticipationPending.value = false
  }
}

async function leaveCurrentEvent() {
  if (!event.value || isParticipationPending.value) return

  actionError.value = ''
  isParticipationPending.value = true

  try {
    const response = await leaveEvent(event.value.id)
    event.value = response.event
  } catch (error: unknown) {
    actionError.value = getApiErrorMessage(error, '取消參加失敗，請稍後再試。')
  } finally {
    isParticipationPending.value = false
  }
}

function returnToEvents() {
  void router.push({ name: 'plaza', query: { tab: 'events' } })
}

function editEvent() {
  if (!event.value) return

  void router.push({ name: 'event-edit', params: { eventId: event.value.id } })
}

async function handleDeleteEvent() {
  if (!event.value || isDeleting.value) return

  actionError.value = ''
  isDeleting.value = true

  try {
    await deleteEvent(event.value.id)
    returnToEvents()
  } catch (error: unknown) {
    actionError.value = getApiErrorMessage(error, '刪除活動失敗，請稍後再試。')
  } finally {
    isDeleting.value = false
  }
}

function confirmDeleteEvent() {
  if (!event.value) return

  confirm.require({
    header: '確認刪除活動',
    message: `確定要刪除「${event.value.title}」嗎？此操作無法復原。`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確認刪除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => void handleDeleteEvent(),
  })
}

watch(() => route.params.eventId, loadEvent, { immediate: true })

onBeforeUnmount(() => {
  requestSequence += 1
})
</script>

<style scoped>
.event-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  padding-block: var(--space-7) var(--space-8);
}

.back-button {
  align-self: flex-start;
}

.back-button :deep(svg),
.event-management-actions :deep(svg),
.participation-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.event-detail-loading,
.event-detail-card,
.event-state-card {
  width: 100%;
  max-width: 68rem;
  min-width: 0;
  margin-inline: auto;
}

.event-detail-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);

  padding: var(--space-7);
  overflow: hidden;

  background: var(--color-primary-pale);
  border-radius: var(--radius-xl);
}

.event-hero {
  display: flex;
  align-items: flex-start;
  gap: var(--space-6);
  min-width: 0;
}

.event-date {
  display: flex;
  width: 80px;
  height: 88px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  color: var(--color-text);
  background: color-mix(in srgb, var(--color-surface) 68%, transparent);
  border-radius: var(--radius-md);
}

.event-date span {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.event-date strong {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-tight);
}

.event-hero-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
}

.event-meta-row,
.event-management-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.event-meta-row {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.event-management-actions {
  justify-content: flex-end;
  margin-top: calc(-1 * var(--space-4));
}

.event-hero h1 {
  margin: 0;

  color: var(--color-primary);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
  overflow-wrap: anywhere;
}

.event-hero h1:focus {
  outline: none;
}

.event-hero p {
  max-width: 70ch;
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  overflow-wrap: anywhere;
}

.event-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.event-section h2,
.event-cta h2 {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.event-info-grid,
.skeleton-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3) var(--space-6);

  margin: 0;
}

.event-info-item {
  min-width: 0;
  padding-block: var(--space-3);
}

.event-info-item dt {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.event-info-item dt svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.event-info-item dd {
  margin: var(--space-1) 0 0 calc(18px + var(--space-2));

  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.event-long-content {
  max-width: 75ch;
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.event-notes {
  display: grid;
  gap: var(--space-3);

  margin: 0;
  padding-inline-start: var(--space-5);

  color: var(--color-text-secondary);
}

.event-notes li {
  padding-inline-start: var(--space-1);
}

.event-notes li::marker {
  color: var(--color-primary);
}

.event-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);

  padding: var(--space-6);

  background: color-mix(in srgb, var(--color-surface) 64%, transparent);
  border-radius: var(--radius-lg);
}

.event-cta div {
  min-width: 0;
}

.event-cta p {
  max-width: 58ch;
  margin: var(--space-2) 0 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

.participation-button {
  flex: 0 0 auto;
}

.event-state-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-8) var(--space-5);

  text-align: center;
  border-radius: var(--radius-xl);
}

.event-state-card h1,
.event-state-card p {
  margin: 0;
}

.event-state-card h1 {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-heading);
}

.event-state-card p {
  color: var(--color-text-secondary);
}

.event-state-icon {
  width: 52px;
  height: 52px;

  color: var(--color-primary);
  stroke-width: 1.6;
}

.event-state-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-3);

  margin-top: var(--space-3);
}

.event-detail-skeleton {
  pointer-events: none;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .event-detail-card {
    gap: var(--space-6);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
  }

  .event-info-grid,
  .skeleton-info-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .event-cta {
    align-items: stretch;
    flex-direction: column;
  }

  .participation-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .event-detail-page {
    gap: var(--space-4);
    padding-block: var(--space-5) var(--space-7);
  }

  .event-detail-card {
    gap: var(--space-5);
    padding: var(--space-5);
  }

  .event-hero {
    flex-direction: column;
    gap: var(--space-4);
  }

  .event-date {
    width: 64px;
    height: 72px;
  }

  .event-date strong,
  .event-hero h1,
  .event-state-card h1 {
    font-size: var(--font-size-lg);
  }

  .event-management-actions,
  .event-management-actions :deep(.p-button),
  .event-state-actions,
  .event-state-actions :deep(.base-button) {
    width: 100%;
  }

  .event-section {
    padding-top: var(--space-5);
  }

  .event-cta {
    padding: var(--space-5);
  }
}
</style>
