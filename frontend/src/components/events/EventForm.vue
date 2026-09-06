<template>
  <component
    :is="dialog ? 'form' : BaseCard"
    :as="dialog ? undefined : 'form'"
    class="event-form"
    :class="{ 'event-form--dialog': dialog }"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <div class="event-form__body">
      <div class="event-form-grid">
        <div class="form-field form-field--full">
          <label for="event-title">活動名稱</label>
          <InputText
            id="event-title"
            v-model="title"
            maxlength="120"
            placeholder="例如：週末河濱輕鬆跑"
            :invalid="Boolean(errors.title)"
            :aria-describedby="describedBy('title')"
            fluid
          />
          <small v-if="errors.title" id="event-title-error" class="field-error" role="alert">
            {{ errors.title }}
          </small>
        </div>

        <div class="form-field form-field--full">
          <label for="event-summary">活動簡介</label>
          <Textarea
            id="event-summary"
            v-model="summary"
            rows="3"
            maxlength="300"
            auto-resize
            placeholder="簡短說明活動內容與適合的跑者"
            :invalid="Boolean(errors.summary)"
            :aria-describedby="describedBy('summary')"
            fluid
          />
          <small v-if="errors.summary" id="event-summary-error" class="field-error" role="alert">
            {{ errors.summary }}
          </small>
        </div>

        <div class="form-field">
          <label for="event-date">活動日期</label>
          <DatePicker
            id="event-date"
            v-model="eventDate"
            :min-date="isEditMode ? undefined : minimumDate"
            date-format="yy/mm/dd"
            show-icon
            :invalid="Boolean(errors.eventDate)"
            :aria-describedby="describedBy('eventDate')"
            fluid
          />
          <small
            v-if="errors.eventDate"
            id="event-eventDate-error"
            class="field-error"
            role="alert"
          >
            {{ errors.eventDate }}
          </small>
        </div>

        <div class="time-fields">
          <div class="form-field">
            <label for="event-start-time">開始時間</label>
            <DatePicker
              id="event-start-time"
              v-model="startTime"
              time-only
              hour-format="24"
              :invalid="Boolean(errors.startTime)"
              :aria-describedby="describedBy('startTime')"
              fluid
            />
            <small
              v-if="errors.startTime"
              id="event-startTime-error"
              class="field-error"
              role="alert"
            >
              {{ errors.startTime }}
            </small>
          </div>

          <div class="form-field">
            <label for="event-end-time">結束時間</label>
            <DatePicker
              id="event-end-time"
              v-model="endTime"
              time-only
              hour-format="24"
              :invalid="Boolean(errors.endTime)"
              :aria-describedby="describedBy('endTime')"
              fluid
            />
            <small v-if="errors.endTime" id="event-endTime-error" class="field-error" role="alert">
              {{ errors.endTime }}
            </small>
          </div>
        </div>

        <div class="form-field">
          <label for="event-location">活動地點</label>
          <InputText
            id="event-location"
            v-model="location"
            maxlength="160"
            placeholder="例如：大佳河濱公園"
            :invalid="Boolean(errors.location)"
            :aria-describedby="describedBy('location')"
            fluid
          />
          <small v-if="errors.location" id="event-location-error" class="field-error" role="alert">
            {{ errors.location }}
          </small>
        </div>

        <div class="form-field">
          <label for="event-distance">活動距離</label>
          <InputText
            id="event-distance"
            v-model="distance"
            maxlength="80"
            placeholder="例如：5K、自由距離"
            :invalid="Boolean(errors.distance)"
            :aria-describedby="describedBy('distance')"
            fluid
          />
          <small v-if="errors.distance" id="event-distance-error" class="field-error" role="alert">
            {{ errors.distance }}
          </small>
        </div>

        <div class="form-field">
          <label for="event-capacity">參加人數上限（選填）</label>
          <InputNumber
            id="event-capacity"
            v-model="capacity"
            :min="1"
            :max="100000"
            :use-grouping="false"
            placeholder="未填寫則不限制人數"
            :invalid="Boolean(errors.capacity)"
            :aria-describedby="describedBy('capacity')"
            fluid
          />
          <small v-if="errors.capacity" id="event-capacity-error" class="field-error" role="alert">
            {{ errors.capacity }}
          </small>
        </div>

        <div class="form-field form-field--full">
          <label for="event-content">活動詳細介紹（選填）</label>
          <Textarea
            id="event-content"
            v-model="content"
            rows="6"
            maxlength="5000"
            auto-resize
            placeholder="補充路線、活動方式或其他完整說明"
            fluid
          />
        </div>

        <div class="form-field form-field--full">
          <label for="event-notes">活動提醒（選填）</label>
          <Textarea
            id="event-notes"
            v-model="notesText"
            rows="4"
            auto-resize
            placeholder="每行一項，例如：&#10;請攜帶飲水&#10;活動前請完成暖身"
            :invalid="Boolean(errors.notes)"
            :aria-describedby="
              errors.notes ? 'event-notes-error event-notes-help' : 'event-notes-help'
            "
            fluid
          />
          <small id="event-notes-help" class="field-help">每行一項，最多 10 項。</small>
          <small v-if="errors.notes" id="event-notes-error" class="field-error" role="alert">
            {{ errors.notes }}
          </small>
        </div>
      </div>

      <Message
        v-if="errorMessage"
        severity="error"
        :variant="dialog ? 'simple' : undefined"
        :closable="false"
        :class="{ 'event-form-error-message': dialog }"
        role="alert"
      >
        {{ errorMessage }}
      </Message>
    </div>

    <footer class="event-form-actions">
      <BaseButton
        type="button"
        label="取消"
        :icon="dialog ? 'pi pi-times' : undefined"
        :disabled="isSubmitting"
        @click="emit('cancel')"
      />
      <BaseButton
        type="submit"
        :icon="dialog ? 'pi pi-check' : undefined"
        :label="isEditMode ? '儲存活動' : '發起活動'"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      />
    </footer>
  </component>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type { EventFormPayload, RunningEvent } from '@/types/event'

type FieldName =
  | 'title'
  | 'summary'
  | 'eventDate'
  | 'startTime'
  | 'endTime'
  | 'location'
  | 'distance'
  | 'capacity'
  | 'notes'

const props = withDefaults(
  defineProps<{
    initialEvent?: RunningEvent
    isSubmitting?: boolean
    errorMessage?: string
    dialog?: boolean
  }>(),
  {
    initialEvent: undefined,
    isSubmitting: false,
    errorMessage: '',
    dialog: false,
  },
)

const emit = defineEmits<{
  submit: [payload: EventFormPayload]
  cancel: []
}>()

const initialStart = props.initialEvent ? new Date(props.initialEvent.startAt) : null
const initialEnd = props.initialEvent ? new Date(props.initialEvent.endAt) : null

const title = ref(props.initialEvent?.title ?? '')
const summary = ref(props.initialEvent?.summary ?? '')
const eventDate = ref<Date | null>(initialStart)
const startTime = ref<Date | null>(initialStart)
const endTime = ref<Date | null>(initialEnd)
const location = ref(props.initialEvent?.location ?? '')
const distance = ref(props.initialEvent?.distance ?? '')
const capacity = ref<number | null>(props.initialEvent?.capacity ?? null)
const content = ref(props.initialEvent?.content ?? '')
const notesText = ref(props.initialEvent?.notes.join('\n') ?? '')
const errors = reactive<Partial<Record<FieldName, string>>>({})

const minimumDate = new Date()
minimumDate.setHours(0, 0, 0, 0)

const isEditMode = computed(() => Boolean(props.initialEvent))

const describedBy = (field: FieldName) => (errors[field] ? `event-${field}-error` : undefined)

const combineDateAndTime = (date: Date, time: Date) => {
  const result = new Date(date)
  result.setHours(time.getHours(), time.getMinutes(), 0, 0)

  return result
}

const clearErrors = () => {
  Object.keys(errors).forEach((key) => delete errors[key as FieldName])
}

const handleSubmit = () => {
  clearErrors()

  if (!title.value.trim()) errors.title = '請輸入活動名稱'
  if (!summary.value.trim()) errors.summary = '請輸入活動簡介'
  if (!eventDate.value) errors.eventDate = '請選擇活動日期'
  if (!startTime.value) errors.startTime = '請選擇開始時間'
  if (!endTime.value) errors.endTime = '請選擇結束時間'
  if (!location.value.trim()) errors.location = '請輸入活動地點'
  if (!distance.value.trim()) errors.distance = '請輸入活動距離'

  if (capacity.value !== null && (!Number.isInteger(capacity.value) || capacity.value < 1)) {
    errors.capacity = '參加人數上限必須是大於 0 的整數'
  }

  const notes = notesText.value
    .split(/\r?\n/)
    .map((note) => note.trim())
    .filter(Boolean)

  if (notes.length > 10) errors.notes = '活動提醒最多 10 項'
  if (notes.some((note) => note.length > 200)) errors.notes = '每項活動提醒不能超過 200 個字元'

  if (Object.keys(errors).length || !eventDate.value || !startTime.value || !endTime.value) return

  const startAt = combineDateAndTime(eventDate.value, startTime.value)
  const endAt = combineDateAndTime(eventDate.value, endTime.value)

  if (endAt.getTime() <= startAt.getTime()) {
    errors.endTime = '結束時間必須晚於開始時間'
    return
  }

  if (endAt.getTime() <= Date.now()) {
    errors.eventDate = '活動結束時間必須晚於現在'
    return
  }

  if (!isEditMode.value && startAt.getTime() <= Date.now()) {
    errors.eventDate = '活動開始時間必須晚於現在'
    return
  }

  emit('submit', {
    title: title.value.trim(),
    summary: summary.value.trim(),
    location: location.value.trim(),
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    distance: distance.value.trim(),
    notes,
    ...(capacity.value !== null ? { capacity: capacity.value } : {}),
    ...(content.value.trim() ? { content: content.value.trim() } : {}),
  })
}
</script>

<style scoped>
.event-form {
  --event-control-height: calc(var(--space-7) + var(--space-1));

  display: flex;
  flex-direction: column;
}

.event-form:not(.event-form--dialog) {
  padding: var(--space-6);

  background: var(--color-primary-pale);
  border-radius: var(--radius-xl);
}

.event-form--dialog {
  --event-control-height: calc(var(--space-6) + var(--space-1));

  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  letter-spacing: var(--letter-spacing-base);
}

.event-form__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.event-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.form-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2);
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field label {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.event-form--dialog .form-field label {
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-base);
}

.event-form--dialog :deep(.event-form-error-message.p-message) {
  padding: 0;
  border: 0;
  color: var(--color-accent);
  background: transparent;
  box-shadow: none;
}

.event-form--dialog :deep(.event-form-error-message .p-message-content) {
  gap: 0;
  padding: 0;
}

.event-form--dialog :deep(.event-form-error-message .p-message-icon) {
  display: none;
}

.event-form--dialog :deep(.event-form-error-message .p-message-text) {
  color: inherit;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-base);
}

.time-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  min-width: 0;
}

.field-help,
.field-error {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-heading);
}

.field-help {
  color: var(--color-text-secondary);
}

.field-error {
  color: var(--color-error);
}

.event-form :deep(.p-inputtext),
.event-form :deep(.p-textarea),
.event-form :deep(.p-inputnumber),
.event-form :deep(.p-datepicker) {
  width: 100%;
  min-width: 0;
  border-color: var(--color-border);
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  box-shadow: none;
  font-family: var(--font-family-base);
}

.event-form--dialog :deep(.p-inputtext),
.event-form--dialog :deep(.p-textarea),
.event-form--dialog :deep(.p-inputnumber),
.event-form--dialog :deep(.p-datepicker) {
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 34%, transparent);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.event-form :deep(.p-inputtext),
.event-form :deep(.p-inputnumber),
.event-form :deep(.p-datepicker) {
  min-height: var(--event-control-height);
  border-radius: var(--radius-full);
}

.event-form :deep(.p-textarea) {
  border-radius: var(--radius-md);
  line-height: var(--line-height-base);
}

.event-form--dialog :deep(.p-inputtext),
.event-form--dialog :deep(.p-textarea) {
  padding-inline: var(--space-4);
  font-size: var(--font-size-sm);
  letter-spacing: var(--letter-spacing-base);
}

.event-form--dialog :deep(.p-datepicker .p-inputtext),
.event-form--dialog :deep(.p-inputnumber .p-inputtext) {
  height: calc(var(--event-control-height) - 2px);
  padding: 0 var(--space-4);
  border: 0;
  border-radius: inherit;
  background: transparent;
}

.event-form--dialog :deep(.p-inputtext::placeholder) {
  color: var(--color-text-secondary);
  opacity: 0.78;
}

.event-form--dialog :deep(.p-datepicker-dropdown) {
  flex: 0 0 calc(var(--space-6) + var(--space-2));
  width: calc(var(--space-6) + var(--space-2));
  border: 0;
  border-radius: var(--radius-full);
  color: var(--color-dark-light);
  background: transparent;
  box-shadow: none;
}

.event-form--dialog :deep(.p-datepicker-dropdown:hover) {
  color: var(--color-dark);
  background: var(--color-primary-pale);
}

.event-form :deep(.p-inputtext:hover),
.event-form :deep(.p-textarea:hover),
.event-form :deep(.p-inputnumber:hover),
.event-form :deep(.p-datepicker:hover) {
  border-color: var(--color-primary-light);
}

.event-form :deep(.p-inputtext:focus),
.event-form :deep(.p-textarea:focus),
.event-form :deep(.p-inputnumber:focus-within),
.event-form :deep(.p-datepicker:focus-within) {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.event-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.event-form:not(.event-form--dialog) .event-form-actions {
  padding-top: var(--space-4);

  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .event-form:not(.event-form--dialog) {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
  }

  .event-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .form-field--full {
    grid-column: auto;
  }
}

@media (max-width: 480px) {
  .time-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .event-form:not(.event-form--dialog) .event-form-actions {
    flex-direction: column-reverse;
  }

  .event-form:not(.event-form--dialog) .event-form-actions :deep(.base-button) {
    width: 100%;
  }
}
</style>
