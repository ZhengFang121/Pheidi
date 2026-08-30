<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import { useConfirm } from 'primevue/useconfirm'

import BadgeCollection from '@/components/badges/BadgeCollection.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import PheidiJourneySection from '@/components/journey/PheidiJourneySection.vue'
import RunRecordForm from '@/components/run/RunRecordForm.vue'
import { useRunnerProgress } from '@/composables/useRunnerProgress'
import {
  RUN_LOCATION_OPTIONS,
  RUN_MOOD_OPTIONS,
  WEATHER_CONDITION_OPTIONS,
} from '@/constants/runRecord'
import { deleteRunRecord, getRunRecords } from '@/services/runRecords'
import type { RunRecord } from '@/types/runRecord'
import {
  getLocalDateKey,
  getLocalMonthRange,
  getMonthCalendarDates,
  getMonthTitle,
} from '@/utils/runRecordDate'

interface ApiErrorResponse {
  message?: string
}

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'] as const

const locationLabels = new Map(RUN_LOCATION_OPTIONS.map((option) => [option.value, option.label]))

const moodLabels = new Map(RUN_MOOD_OPTIONS.map((option) => [option.value, option.label]))

const weatherLabels = new Map(
  WEATHER_CONDITION_OPTIONS.map((option) => [option.value, option.label]),
)

const confirm = useConfirm()
const {
  runnerProgress,
  isRunnerProgressLoading,
  runnerProgressError,
  loadRunnerProgress,
} = useRunnerProgress()

const now = new Date()

const currentMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1))
const runRecords = ref<RunRecord[]>([])
const selectedDateKey = ref<string | null>(null)
const isLoading = ref(false)
const showLoadingState = ref(false)
const errorMessage = ref('')
const actionErrorMessage = ref('')
const editingRunRecord = ref<RunRecord | null>(null)
const isEditDialogVisible = ref(false)
const deletingRunRecordId = ref<string | null>(null)

let latestRequestId = 0
let loadingStateTimer: ReturnType<typeof setTimeout> | undefined

const currentMonthTitle = computed(() =>
  getMonthTitle(currentMonth.value.getFullYear(), currentMonth.value.getMonth()),
)

const runRecordsByDate = computed(() => {
  const recordsByDate = new Map<string, RunRecord[]>()

  for (const runRecord of runRecords.value) {
    const dateKey = getLocalDateKey(runRecord.runDate)
    const dateRecords = recordsByDate.get(dateKey)

    if (dateRecords) {
      dateRecords.push(runRecord)
    } else {
      recordsByDate.set(dateKey, [runRecord])
    }
  }

  for (const dateRecords of recordsByDate.values()) {
    dateRecords.sort(
      (firstRecord, secondRecord) =>
        new Date(firstRecord.runDate).getTime() - new Date(secondRecord.runDate).getTime(),
    )
  }

  return recordsByDate
})

const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear()
  const monthIndex = currentMonth.value.getMonth()

  return getMonthCalendarDates(year, monthIndex).map((calendarDate) => {
    const records = runRecordsByDate.value.get(calendarDate.dateKey) ?? []

    const thumbnailUrl = records.find((record) => record.images.length > 0)?.images[0]

    return {
      ...calendarDate,
      records,
      thumbnailUrl,
    }
  })
})

const selectedDateRecords = computed(() => {
  if (!selectedDateKey.value) {
    return []
  }

  return runRecordsByDate.value.get(selectedDateKey.value) ?? []
})

const selectedDateTitle = computed(() => {
  if (!selectedDateKey.value) {
    return ''
  }

  const [year, month, day] = selectedDateKey.value.split('-').map(Number)

  return `${year} 年 ${month} 月 ${day} 日`
})

const canGoToNextMonth = computed(() => {
  const selectedMonthValue = currentMonth.value.getFullYear() * 12 + currentMonth.value.getMonth()

  const currentMonthValue = now.getFullYear() * 12 + now.getMonth()

  return selectedMonthValue < currentMonthValue
})

const formatRunTime = (runDate: string) =>
  new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(runDate))

const formatDistance = (distance: number) =>
  `${distance.toLocaleString('zh-TW', {
    maximumFractionDigits: 2,
  })} 公里`

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60
  const durationParts: string[] = []

  if (hours > 0) {
    durationParts.push(`${hours} 小時`)
  }

  if (minutes > 0) {
    durationParts.push(`${minutes} 分鐘`)
  }

  if (seconds > 0 || durationParts.length === 0) {
    durationParts.push(`${seconds} 秒`)
  }

  return durationParts.join(' ')
}

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data.message) {
    return error.response.data.message
  }

  return fallbackMessage
}

const loadMonthRecords = async () => {
  const requestId = ++latestRequestId
  const year = currentMonth.value.getFullYear()
  const monthIndex = currentMonth.value.getMonth()
  const range = getLocalMonthRange(year, monthIndex)

  if (loadingStateTimer) {
    clearTimeout(loadingStateTimer)
  }

  isLoading.value = true
  showLoadingState.value = false
  errorMessage.value = ''
  actionErrorMessage.value = ''

  loadingStateTimer = setTimeout(() => {
    if (requestId === latestRequestId && isLoading.value) {
      showLoadingState.value = true
    }
  }, 200)

  try {
    const response = await getRunRecords(range)

    if (requestId !== latestRequestId) {
      return
    }

    runRecords.value = response.runRecords
  } catch (error: unknown) {
    if (requestId !== latestRequestId) {
      return
    }

    runRecords.value = []
    errorMessage.value = getApiErrorMessage(error, '無法取得這個月份的跑步紀錄，請稍後再試。')
  } finally {
    if (requestId === latestRequestId) {
      if (loadingStateTimer) {
        clearTimeout(loadingStateTimer)
        loadingStateTimer = undefined
      }

      isLoading.value = false
      showLoadingState.value = false
    }
  }
}

const isInCurrentMonth = (runDate: string) => {
  const date = new Date(runDate)

  return (
    date.getFullYear() === currentMonth.value.getFullYear() &&
    date.getMonth() === currentMonth.value.getMonth()
  )
}

const clearSelectedDateIfEmpty = () => {
  if (
    selectedDateKey.value &&
    !runRecords.value.some(
      (runRecord) => getLocalDateKey(runRecord.runDate) === selectedDateKey.value,
    )
  ) {
    selectedDateKey.value = null
  }
}

const openEditDialog = (runRecord: RunRecord) => {
  if (deletingRunRecordId.value) {
    return
  }

  actionErrorMessage.value = ''
  editingRunRecord.value = runRecord
  isEditDialogVisible.value = true
}

const closeEditDialog = () => {
  isEditDialogVisible.value = false
}

const handleRunRecordUpdated = (updatedRunRecord: RunRecord) => {
  if (isInCurrentMonth(updatedRunRecord.runDate)) {
    runRecords.value = runRecords.value.map((runRecord) =>
      runRecord.id === updatedRunRecord.id ? updatedRunRecord : runRecord,
    )
    selectedDateKey.value = getLocalDateKey(updatedRunRecord.runDate)
  } else {
    runRecords.value = runRecords.value.filter(
      (runRecord) => runRecord.id !== updatedRunRecord.id,
    )
    clearSelectedDateIfEmpty()
  }

  closeEditDialog()
  void loadRunnerProgress()
}

const deleteSelectedRunRecord = async (runRecord: RunRecord) => {
  if (deletingRunRecordId.value) {
    return
  }

  deletingRunRecordId.value = runRecord.id
  actionErrorMessage.value = ''

  try {
    await deleteRunRecord(runRecord.id)

    runRecords.value = runRecords.value.filter(
      (currentRunRecord) => currentRunRecord.id !== runRecord.id,
    )
    clearSelectedDateIfEmpty()
    void loadRunnerProgress()
  } catch (error: unknown) {
    actionErrorMessage.value = getApiErrorMessage(
      error,
      '刪除跑步紀錄失敗，請稍後再試。',
    )
  } finally {
    deletingRunRecordId.value = null
  }
}

const confirmDeleteRunRecord = (runRecord: RunRecord) => {
  if (deletingRunRecordId.value) {
    return
  }

  confirm.require({
    header: '確認刪除跑步紀錄',
    message: `確定要刪除 ${formatRunTime(runRecord.runDate)}、${formatDistance(runRecord.distance)} 的跑步紀錄嗎？刪除後將無法復原。`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確認刪除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => {
      void deleteSelectedRunRecord(runRecord)
    },
  })
}

const selectCalendarDate = (dateKey: string, isCurrentMonth: boolean, recordCount: number) => {
  if (!isCurrentMonth || recordCount === 0) {
    return
  }

  selectedDateKey.value = dateKey
}

const goToPreviousMonth = () => {
  runRecords.value = []
  selectedDateKey.value = null
  actionErrorMessage.value = ''

  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1,
  )
}

const goToNextMonth = () => {
  if (!canGoToNextMonth.value) {
    return
  }

  runRecords.value = []
  selectedDateKey.value = null
  actionErrorMessage.value = ''

  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1,
  )
}

onBeforeUnmount(() => {
  if (loadingStateTimer) {
    clearTimeout(loadingStateTimer)
  }
})

onMounted(() => {
  void loadRunnerProgress()
})

watch(
  currentMonth,
  () => {
    void loadMonthRecords()
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <section class="layout-container station-page">
    <ConfirmDialog />

    <Dialog
      v-model:visible="isEditDialogVisible"
      modal
      header="編輯跑步紀錄"
      :draggable="false"
      :style="{ width: '44rem' }"
      :breakpoints="{ '768px': 'calc(100vw - 32px)' }"
      :content-style="{
        maxHeight: 'calc(100vh - 10rem)',
        overflowY: 'auto',
      }"
      @hide="editingRunRecord = null"
    >
      <RunRecordForm
        v-if="editingRunRecord"
        :key="editingRunRecord.id"
        :run-record="editingRunRecord"
        @submitted="handleRunRecordUpdated"
        @cancel="closeEditDialog"
      />
    </Dialog>

    <header class="station-heading">
      <p class="station-eyebrow">TRAIL STATION</p>

      <h1 class="station-title">足跡驛站</h1>

      <p class="station-description">每一次出發都會留下足跡，從月曆回顧你的跑步旅程。</p>
    </header>

    <BaseCard as="section" class="station-calendar-card" aria-labelledby="station-month-heading">
      <header class="station-calendar-toolbar">
        <Button
          type="button"
          severity="secondary"
          text
          rounded
          aria-label="查看上一個月"
          :disabled="isLoading"
          @click="goToPreviousMonth"
        >
          <template #icon>
            <ChevronLeft aria-hidden="true" />
          </template>
        </Button>

        <div class="station-month-heading">
          <h2 id="station-month-heading">
            {{ currentMonthTitle }}
          </h2>

          <span aria-live="polite"> 共 {{ runRecords.length }} 筆跑步紀錄 </span>
        </div>

        <Button
          type="button"
          severity="secondary"
          text
          rounded
          aria-label="查看下一個月"
          :disabled="isLoading || !canGoToNextMonth"
          @click="goToNextMonth"
        >
          <template #icon>
            <ChevronRight aria-hidden="true" />
          </template>
        </Button>
      </header>

      <Message v-if="errorMessage" severity="error" :closable="false">
        <div class="station-error">
          <span>{{ errorMessage }}</span>

          <Button
            type="button"
            label="重新載入"
            severity="secondary"
            size="small"
            @click="loadMonthRecords"
          />
        </div>
      </Message>

      <div v-else-if="showLoadingState" class="station-loading" aria-label="月份跑步紀錄載入中">
        <Skeleton
          v-for="index in 5"
          :key="index"
          height="4.5rem"
          border-radius="var(--radius-md)"
        />
      </div>

      <div v-else class="station-calendar" :aria-busy="isLoading">
        <div class="station-weekday-grid" aria-hidden="true">
          <span v-for="weekday in weekdayLabels" :key="weekday" class="station-weekday">
            {{ weekday }}
          </span>
        </div>

        <div class="station-date-grid">
          <button
            v-for="calendarDate in calendarDates"
            :key="calendarDate.dateKey"
            type="button"
            class="station-date-cell"
            :class="{
              'station-date-cell--outside': !calendarDate.isCurrentMonth,
              'station-date-cell--today': calendarDate.isToday,
              'station-date-cell--recorded': calendarDate.records.length > 0,
              'station-date-cell--selected': selectedDateKey === calendarDate.dateKey,
            }"
            :disabled="!calendarDate.isCurrentMonth || calendarDate.records.length === 0"
            :aria-label="
              calendarDate.records.length > 0
                ? `${calendarDate.dateKey}，共有 ${calendarDate.records.length} 筆跑步紀錄`
                : calendarDate.dateKey
            "
            :aria-pressed="selectedDateKey === calendarDate.dateKey"
            @click="
              selectCalendarDate(
                calendarDate.dateKey,
                calendarDate.isCurrentMonth,
                calendarDate.records.length,
              )
            "
          >
            <img
              v-if="calendarDate.thumbnailUrl"
              :src="calendarDate.thumbnailUrl"
              alt=""
              class="station-date-content station-date-thumbnail"
              loading="lazy"
            />

            <span v-else class="station-date-content station-date-number">
              {{ calendarDate.dayNumber }}
            </span>
          </button>
        </div>
      </div>
    </BaseCard>
    <BaseCard
      v-if="selectedDateKey && selectedDateRecords.length > 0"
      as="section"
      class="station-day-section"
      aria-labelledby="station-day-heading"
    >
      <header class="station-day-heading">
        <div>
          <p class="station-day-eyebrow">DAILY RECORD</p>

          <h2 id="station-day-heading">
            {{ selectedDateTitle }}
          </h2>
        </div>

        <span> 共 {{ selectedDateRecords.length }} 筆紀錄 </span>
      </header>

      <Message v-if="actionErrorMessage" severity="error" :closable="false">
        {{ actionErrorMessage }}
      </Message>

      <div class="station-record-list">
        <BaseCard
          v-for="runRecord in selectedDateRecords"
          :key="runRecord.id"
          as="article"
          class="station-record-card"
        >
          <div class="station-record-image-wrapper">
            <img
              v-if="runRecord.images.length > 0"
              :src="runRecord.images[0]"
              alt=""
              class="station-record-image"
              loading="lazy"
            />

            <span v-else class="station-record-image-placeholder">尚無照片</span>

            <span v-if="runRecord.images.length > 1" class="station-record-image-count">
              +{{ runRecord.images.length - 1 }}
            </span>
          </div>

          <div class="station-record-content">
            <time class="station-record-time" :datetime="runRecord.runDate">
              {{ formatRunTime(runRecord.runDate) }}
            </time>

            <dl class="station-record-details">
              <div>
                <dt>距離</dt>
                <dd>
                  {{ formatDistance(runRecord.distance) }}
                </dd>
              </div>

              <div>
                <dt>時長</dt>
                <dd>
                  {{ formatDuration(runRecord.duration) }}
                </dd>
              </div>

              <div>
                <dt>地點</dt>
                <dd>
                  {{ locationLabels.get(runRecord.locationType) ?? runRecord.locationType }}
                </dd>
              </div>

              <div>
                <dt>心情</dt>
                <dd>
                  {{ moodLabels.get(runRecord.mood) ?? runRecord.mood }}
                </dd>
              </div>

              <div>
                <dt>天氣</dt>
                <dd>
                  {{
                    weatherLabels.get(runRecord.weather.condition) ?? runRecord.weather.condition
                  }}
                </dd>
              </div>
            </dl>

            <div class="station-record-actions">
              <Button
                type="button"
                label="編輯"
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                size="small"
                :disabled="deletingRunRecordId !== null"
                @click="openEditDialog(runRecord)"
              />

              <Button
                type="button"
                label="刪除"
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                :loading="deletingRunRecordId === runRecord.id"
                :disabled="
                  deletingRunRecordId !== null && deletingRunRecordId !== runRecord.id
                "
                @click="confirmDeleteRunRecord(runRecord)"
              />
            </div>
          </div>
        </BaseCard>
      </div>
    </BaseCard>

    <div class="station-progression-sections">
      <BaseCard v-if="runnerProgressError" class="station-progress-error">
        <Message severity="error" :closable="false">
          {{ runnerProgressError }}
        </Message>

        <Button
          type="button"
          label="重新載入成長資訊"
          severity="secondary"
          outlined
          @click="loadRunnerProgress"
        />
      </BaseCard>

      <template v-else>
        <BadgeCollection
          :definitions="runnerProgress?.badgeDefinitions ?? []"
          :unlocked-badges="runnerProgress?.badges ?? []"
          :loading="isRunnerProgressLoading"
        />

        <PheidiJourneySection
          :stats="runnerProgress?.stats ?? null"
          :eligible="runnerProgress?.pheidiMissionEligible ?? false"
          :loading="isRunnerProgressLoading"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.station-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);

  padding-block: var(--space-7) var(--space-8);
}

.station-heading {
  max-width: 720px;
}

.station-eyebrow {
  margin: 0 0 var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.station-title {
  margin: 0 0 var(--space-3);

  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
}

.station-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.station-progression-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.station-progress-error {
  display: flex;
  min-height: 180px;
  padding: var(--space-6);
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-4);

  border-radius: var(--radius-lg);
}

.station-day-section {
  display: flex;
  width: min(100%, 720px);
  margin-inline: auto;
  flex-direction: column;
  gap: var(--space-5);

  padding: var(--space-6);

  border-radius: var(--radius-lg);
}

.station-day-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.station-day-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.station-day-heading h2 {
  margin: 0;

  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.station-day-heading > span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.station-record-list {
  display: grid;
  gap: var(--space-4);
}

.station-record-card {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  overflow: hidden;

  border-radius: var(--radius-md);
}

.station-record-image-wrapper {
  position: relative;

  display: flex;
  min-width: 0;
  min-height: 160px;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  background: var(--color-primary-pale);
}

.station-record-image-placeholder {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.station-record-details dd {
  margin: var(--space-1) 0 0;

  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.station-record-image {
  display: block;
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.station-record-image-count {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);

  padding: var(--space-1) var(--space-2);

  color: white;
  font-size: var(--font-size-xs);
  line-height: 1;

  background: var(--color-dark);
  border-radius: var(--radius-full);
}

.station-record-content {
  display: flex;
  min-width: 0;
  padding: var(--space-4);
  flex-direction: column;
  gap: var(--space-3);
}

.station-record-time {
  color: var(--color-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.station-record-actions {
  display: flex;
  margin-top: auto;
  padding-top: var(--space-2);
  flex-wrap: wrap;
  gap: var(--space-2);

  border-top: 1px solid var(--color-border);
}

.station-record-details {
  display: grid;
  margin: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.station-record-details div {
  min-width: 0;
}

.station-record-details dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.station-record-details dd {
  margin: var(--space-1) 0 0;

  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.station-calendar-card {
  display: flex;
  width: min(100%, 720px);
  margin-inline: auto;
  flex-direction: column;
  gap: var(--space-5);

  padding: var(--space-6);

  border-radius: var(--radius-lg);
}

.station-calendar-toolbar {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: var(--space-3);
}

.station-calendar-toolbar :deep(.p-button) {
  width: 44px;
  height: 44px;
}

.station-calendar-toolbar :deep(svg) {
  width: 22px;
  height: 22px;
}

.station-month-heading {
  text-align: center;
}

.station-month-heading h2 {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.station-month-heading span {
  display: block;
  margin-top: var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.station-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);

  width: 100%;
}

.station-loading {
  display: grid;
  min-height: 280px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: var(--space-3);
}

.station-calendar {
  width: min(100%, 600px);
  margin-inline: auto;
}

.station-weekday-grid,
.station-date-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.station-weekday-grid {
  margin-bottom: var(--space-2);
}

.station-weekday {
  padding: var(--space-2);

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.station-weekday:nth-child(6),
.station-weekday:nth-child(7) {
  color: var(--color-accent);
}

.station-date-grid {
  row-gap: var(--space-1);
}

.station-date-cell {
  display: grid;
  aspect-ratio: 1 / 1;
  min-width: 0;
  min-height: 0;
  padding: var(--space-1);
  place-items: center;

  color: var(--color-text);
  font-family: var(--font-family-base);
  text-align: center;

  cursor: default;

  background: transparent;
  border: 0;

  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

.station-date-cell--recorded {
  cursor: pointer;
}

.station-date-cell--recorded:hover {
  opacity: 0.78;
}

.station-date-cell--recorded:focus-visible {
  outline: none;
}

.station-date-cell--recorded:focus-visible .station-date-content,
.station-date-cell--selected .station-date-content {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}

.station-date-cell--outside {
  color: var(--color-text-secondary);
  opacity: 0.35;
}

.station-date-cell:disabled {
  cursor: default;
}

.station-date-content {
  width: clamp(36px, 68%, 58px);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
}

.station-date-number {
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.station-date-cell--today .station-date-number {
  color: white;

  background: var(--color-accent);
}

.station-date-thumbnail {
  display: block;

  object-fit: cover;

  border: 3px solid var(--color-primary);
}

@media (max-width: 768px) {
  .station-page {
    gap: var(--space-5);

    padding-block: var(--space-5) var(--space-7);
  }

  .station-title {
    font-size: var(--font-size-lg);
  }

  .station-progression-sections {
    gap: var(--space-7);
  }

  .station-calendar-card {
    gap: var(--space-4);

    padding: var(--space-4);
  }

  .station-loading {
    grid-template-columns: 1fr;
  }

  .station-date-cell {
    padding: 0;
  }

  .station-date-content {
    width: clamp(30px, 78%, 50px);
  }

  .station-date-number {
    font-size: var(--font-size-sm);
  }

  .station-day-section {
    gap: var(--space-4);

    padding: var(--space-4);
  }

  .station-record-card {
    grid-template-columns: 112px minmax(0, 1fr);
  }

  .station-record-image-wrapper {
    min-height: 144px;
  }

  .station-record-details {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}

@media (max-width: 480px) {
  .station-calendar-card {
    padding-inline: var(--space-3);
  }

  .station-error {
    align-items: stretch;
    flex-direction: column;
  }

  .station-day-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-1);
  }

  .station-record-card {
    grid-template-columns: 1fr;
  }

  .station-record-image-wrapper {
    height: 180px;
    min-height: 0;
  }

  .station-record-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .station-record-actions > :deep(.p-button) {
    flex: 1 1 0;
    justify-content: center;
  }
}
</style>
