<script setup lang="ts">
import { isAxiosError } from 'axios'
import { BatteryLow, Cloud, CloudRain, Frown, Laugh, Meh, Smile, Sun } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'

import BaseButton from '@/components/base/BaseButton.vue'
import {
  RUN_LOCATION_OPTIONS,
  RUN_MOOD_OPTIONS,
  WEATHER_CONDITION_OPTIONS,
  type RunLocationType,
  type RunMood,
  type WeatherCondition,
  type WeatherSource,
} from '@/constants/runRecord'
import { toProgressionEvents, useProgressionEvents } from '@/composables/useProgressionEvents'
import { createRunRecord, updateRunRecord, uploadRunRecordImage } from '@/services/runRecords'
import { getWeatherConditionForDate } from '@/services/weather'
import type { RunRecord } from '@/types/runRecord'
import { getRunRecordCoordinates, type RunRecordCoordinates } from '@/utils/geolocation'

const props = defineProps<{
  runRecord?: RunRecord
}>()

const { enqueueProgressionEvents } = useProgressionEvents()

const emit = defineEmits<{
  submitted: [runRecord: RunRecord]
  cancel: []
  submittingChange: [submitting: boolean]
}>()

const runLocationOptions = [...RUN_LOCATION_OPTIONS]
const runMoodOptions = [...RUN_MOOD_OPTIONS]
const weatherConditionOptions = [...WEATHER_CONDITION_OPTIONS]

const moodIcons: Record<RunMood, Component> = {
  great: Laugh,
  good: Smile,
  okay: Meh,
  tired: Frown,
  exhausted: BatteryLow,
}

const weatherIcons: Record<WeatherCondition, Component> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
}

const getMoodIcon = (value: RunMood) => moodIcons[value]

const getWeatherIcon = (value: WeatherCondition) => weatherIcons[value]

const getMoodLabel = (value: RunMood) =>
  runMoodOptions.find((option) => option.value === value)?.label ?? ''

const isEditMode = computed(() => Boolean(props.runRecord))
const initialDuration = props.runRecord?.duration ?? 1800

const runDate = ref<Date | null>(props.runRecord ? new Date(props.runRecord.runDate) : new Date())
const maxRunDate = ref(new Date())
const locationType = ref<RunLocationType>(props.runRecord?.locationType ?? 'city')
const distance = ref<number | null>(props.runRecord?.distance ?? null)
const durationHours = ref(Math.floor(initialDuration / 3600))
const durationMinutes = ref(Math.floor((initialDuration % 3600) / 60))
const durationSeconds = ref(initialDuration % 60)
const mood = ref<RunMood>(props.runRecord?.mood ?? 'good')

const weatherCondition = ref<WeatherCondition>(props.runRecord?.weather.condition ?? 'sunny')
const weatherSource = ref<WeatherSource>(props.runRecord?.weather.source ?? 'manual')
const coordinates = ref<RunRecordCoordinates | null>(null)

const weatherIndex = computed(() => {
  const selectedIndex = weatherConditionOptions.findIndex(
    (option) => option.value === weatherCondition.value,
  )

  return Math.max(selectedIndex, 0)
})

const weatherIndicatorOffset = computed(() => `${weatherIndex.value * 100}%`)

const weatherLoading = ref(false)
const submitError = ref('')
const submitting = ref(false)

const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(props.runRecord?.images[0] ?? null)
const uploadedImageUrl = ref<string | null>(props.runRecord?.images[0] ?? null)
const imageErrorMessage = ref('')

const maximumImageSize = 5 * 1024 * 1024

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

let weatherTimer: ReturnType<typeof setTimeout> | undefined

const totalDurationSeconds = computed(
  () => durationHours.value * 3600 + durationMinutes.value * 60 + durationSeconds.value,
)

const getCoordinates = async () => {
  if (coordinates.value) {
    return coordinates.value
  }

  coordinates.value = await getRunRecordCoordinates()
  return coordinates.value
}

const loadWeather = async () => {
  if (!runDate.value || runDate.value.getTime() > Date.now()) {
    return
  }

  weatherLoading.value = true

  try {
    const selectedCoordinates = await getCoordinates()

    weatherCondition.value = await getWeatherConditionForDate(
      selectedCoordinates.latitude,
      selectedCoordinates.longitude,
      runDate.value,
    )

    weatherSource.value = selectedCoordinates.source
  } catch {
    weatherCondition.value = 'sunny'
    weatherSource.value = 'manual'
  } finally {
    weatherLoading.value = false
  }
}

const scheduleWeatherUpdate = () => {
  if (weatherTimer) {
    clearTimeout(weatherTimer)
  }

  weatherTimer = setTimeout(() => {
    void loadWeather()
  }, 500)
}

const handleWeatherChange = (condition: WeatherCondition) => {
  weatherCondition.value = condition
  weatherSource.value = 'manual'
}

const revokeImagePreviewUrl = () => {
  if (!imagePreviewUrl.value?.startsWith('blob:')) {
    return
  }

  URL.revokeObjectURL(imagePreviewUrl.value)
}

const openImagePicker = () => {
  imageInput.value?.click()
}

const clearImage = () => {
  revokeImagePreviewUrl()

  imageFile.value = null
  imagePreviewUrl.value = null
  uploadedImageUrl.value = null
  imageErrorMessage.value = ''

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  imageErrorMessage.value = ''

  if (!file) {
    return
  }

  if (!allowedImageTypes.has(file.type)) {
    imageErrorMessage.value = '照片只支援 JPG、PNG、WebP 或 GIF 格式。'
    input.value = ''
    return
  }

  if (file.size > maximumImageSize) {
    imageErrorMessage.value = '照片大小不能超過 5 MB。'
    input.value = ''
    return
  }

  revokeImagePreviewUrl()

  imageFile.value = file
  uploadedImageUrl.value = null
  imagePreviewUrl.value = URL.createObjectURL(file)
}

const validateForm = () => {
  if (!runDate.value) {
    return '請選擇跑步日期與時間'
  }

  if (runDate.value.getTime() > Date.now()) {
    return '跑步日期時間不能晚於目前時間'
  }

  if (distance.value === null || distance.value <= 0) {
    return '跑步距離必須大於 0'
  }

  if (
    !Number.isInteger(durationHours.value) ||
    !Number.isInteger(durationMinutes.value) ||
    !Number.isInteger(durationSeconds.value)
  ) {
    return '跑步時長必須使用整數'
  }

  if (
    durationHours.value < 0 ||
    durationMinutes.value < 0 ||
    durationMinutes.value > 59 ||
    durationSeconds.value < 0 ||
    durationSeconds.value > 59
  ) {
    return '請輸入正確的跑步時長'
  }

  if (totalDurationSeconds.value <= 0) {
    return '跑步時長必須大於 0'
  }

  return ''
}

interface ApiErrorResponse {
  message?: string
}

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data.message) {
    return error.response.data.message
  }

  return fallbackMessage
}

const handleSubmit = async () => {
  if (submitting.value) {
    return
  }

  submitError.value = validateForm()

  if (submitError.value || !runDate.value || distance.value === null) {
    return
  }

  submitting.value = true
  emit('submittingChange', true)

  try {
    let imageUrl = uploadedImageUrl.value

    if (imageFile.value && !imageUrl) {
      const uploadResponse = await uploadRunRecordImage(imageFile.value)

      imageUrl = uploadResponse.image.url
      uploadedImageUrl.value = imageUrl
    }

    const payload = {
      runDate: runDate.value.toISOString(),
      distance: distance.value,
      duration: totalDurationSeconds.value,
      locationType: locationType.value,
      mood: mood.value,
      weather: {
        condition: weatherCondition.value,
        source: weatherSource.value,
      },
      images: imageUrl ? [imageUrl] : [],
    }

    const response = props.runRecord
      ? await updateRunRecord(props.runRecord.id, payload)
      : await createRunRecord(payload)

    await enqueueProgressionEvents(toProgressionEvents(response.progression))

    emit('submitted', response.runRecord)
  } catch (error: unknown) {
    submitError.value = getApiErrorMessage(error, '跑步紀錄儲存失敗，請稍後再試。')
  } finally {
    submitting.value = false
    emit('submittingChange', false)
  }
}

watch(runDate, scheduleWeatherUpdate)

onMounted(() => {
  maxRunDate.value = new Date()

  if (!isEditMode.value) {
    void loadWeather()
  }
})

onBeforeUnmount(() => {
  if (weatherTimer) {
    clearTimeout(weatherTimer)
  }

  revokeImagePreviewUrl()
})
</script>

<template>
  <form class="run-record-form" @submit.prevent="handleSubmit">
    <div class="run-record-form__body">
      <div class="form-field">
        <label for="run-date" class="form-field__label">跑步日期與時間</label>

        <DatePicker
          id="run-date"
          v-model="runDate"
          :max-date="maxRunDate"
          date-format="yy/mm/dd"
          hour-format="24"
          show-time
          show-icon
          panel-class="run-date-overlay"
          fluid
        />

        <small class="run-form-help">可以補登過去的跑步紀錄，但不能選擇未來時間。</small>
      </div>

      <div class="form-field">
        <label for="run-location" class="form-field__label">跑步地點</label>

        <Select
          id="run-location"
          v-model="locationType"
          :options="runLocationOptions"
          option-label="label"
          option-value="value"
          placeholder="請選擇跑步地點"
          overlay-class="run-select-overlay"
          fluid
        />
      </div>

      <div class="form-field">
        <label for="run-distance" class="form-field__label">跑步距離</label>

        <InputNumber
          id="run-distance"
          v-model="distance"
          :min="0"
          :min-fraction-digits="1"
          :max-fraction-digits="2"
          suffix=" km"
          placeholder="例如 5.2 km"
          fluid
        />
      </div>

      <fieldset class="run-duration-fieldset">
        <legend class="form-field__label">跑步時長</legend>

        <div class="run-duration-grid">
          <InputNumber
            v-model="durationHours"
            :min="0"
            :max="99"
            suffix=" 小時"
            aria-label="跑步時長小時"
            fluid
          />

          <InputNumber
            v-model="durationMinutes"
            :min="0"
            :max="59"
            suffix=" 分"
            aria-label="跑步時長分鐘"
            fluid
          />

          <InputNumber
            v-model="durationSeconds"
            :min="0"
            :max="59"
            suffix=" 秒"
            aria-label="跑步時長秒"
            fluid
          />
        </div>
      </fieldset>

      <div class="form-field">
        <label for="run-mood" class="form-field__label">跑步心情</label>

        <Select
          id="run-mood"
          v-model="mood"
          :options="runMoodOptions"
          option-label="label"
          option-value="value"
          overlay-class="run-select-overlay"
          fluid
        >
          <template #value="{ value }">
            <span v-if="value" class="run-option">
              <component
                :is="getMoodIcon(value)"
                class="run-option-icon"
                :size="18"
                :stroke-width="2"
                aria-hidden="true"
              />
              <span>{{ getMoodLabel(value) }}</span>
            </span>
          </template>

          <template #option="{ option }">
            <span class="run-option">
              <component
                :is="getMoodIcon(option.value)"
                class="run-option-icon"
                :size="18"
                :stroke-width="2"
                aria-hidden="true"
              />
              <span>{{ option.label }}</span>
            </span>
          </template>
        </Select>
      </div>

      <div class="form-field">
        <div>
          <p class="form-field__label run-form-heading">跑步照片（選填）</p>

          <small class="run-form-help">支援 JPG、PNG、WebP、GIF，檔案最大 5 MB。</small>
        </div>

        <div class="run-upload-panel">
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="run-image-input"
            @change="handleImageChange"
          />

          <div v-if="imagePreviewUrl" class="run-image-preview">
            <img :src="imagePreviewUrl" alt="跑步照片預覽" class="run-image-preview__image" />
          </div>

          <div class="run-upload-actions">
            <BaseButton
              type="button"
              :label="imagePreviewUrl ? '更換照片' : '選擇照片'"
              icon="pi pi-image"
              class="run-upload-button"
              :disabled="submitting"
              @click="openImagePicker"
            />

            <Button
              v-if="imagePreviewUrl"
              type="button"
              label="移除照片"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              class="run-remove-image-button"
              :disabled="submitting"
              @click="clearImage"
            />
          </div>
        </div>

        <Message v-if="imageErrorMessage" severity="error" :closable="false">
          {{ imageErrorMessage }}
        </Message>
      </div>

      <div class="form-field">
        <p id="run-weather-label" class="form-field__label run-form-heading">天氣</p>

        <div
          class="run-weather-selector"
          :style="{ '--weather-indicator-offset': weatherIndicatorOffset }"
        >
          <span class="run-weather-indicator-track" aria-hidden="true">
            <span class="run-weather-active-indicator" />
          </span>

          <SelectButton
            :model-value="weatherCondition"
            :options="weatherConditionOptions"
            option-label="label"
            option-value="value"
            class="run-weather-select"
            aria-labelledby="run-weather-label"
            :disabled="weatherLoading"
            :allow-empty="false"
            fluid
            @update:model-value="handleWeatherChange"
          >
            <template #option="{ option }">
              <span class="run-option run-option--centered">
                <component
                  :is="getWeatherIcon(option.value)"
                  class="run-option-icon"
                  :size="18"
                  :stroke-width="2"
                  aria-hidden="true"
                />
                <span>{{ option.label }}</span>
              </span>
            </template>
          </SelectButton>
        </div>

        <small v-if="weatherLoading" class="run-form-help">正在取得天氣……</small>
      </div>

      <Message v-if="submitError" severity="error" :closable="false">
        {{ submitError }}
      </Message>
    </div>

    <footer class="run-form-actions">
      <BaseButton
        type="button"
        label="取消"
        :disabled="submitting"
        @click="emit('cancel')"
      />

      <BaseButton
        type="submit"
        :label="isEditMode ? '儲存修改' : '儲存跑步紀錄'"
        icon="pi pi-check"
        :loading="submitting"
        :disabled="submitting"
      />
    </footer>
  </form>
</template>

<style scoped>
.run-record-form {
  --run-control-height: calc(var(--space-6) + var(--space-1));

  display: flex;
  flex-direction: column;

  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  letter-spacing: var(--letter-spacing-base);
}

.run-form-heading {
  margin: 0;
}

.run-form-help {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-base);
}

.run-duration-fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;

  border: 0;
}

.run-duration-fieldset > .form-field__label {
  display: block;
  width: 100%;
  margin-bottom: var(--space-2);
  padding: 0;
}

.run-duration-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.run-duration-grid > * {
  min-width: 0;
}

.run-option {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
}

.run-option--centered {
  justify-content: center;
}

.run-option-icon {
  flex: 0 0 auto;
}

.run-form-actions {
  display: flex;
  flex-direction: row;
  gap: var(--space-3);
  justify-content: flex-end;
}

.run-image-input {
  position: absolute;

  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;

  white-space: nowrap;

  clip: rect(0, 0, 0, 0);
  border: 0;
}

.run-image-preview {
  width: 100%;
  overflow: hidden;

  background: color-mix(in srgb, var(--color-surface) 32%, transparent);
  border-radius: var(--radius-lg);
}

.run-image-preview__image {
  display: block;
  width: 100%;
  max-height: 320px;

  object-fit: contain;
}

.run-upload-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px dashed var(--color-primary-light);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-primary-pale) 48%, transparent);
}

.run-upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.run-upload-actions :deep(.p-button),
.run-form-actions :deep(.p-button) {
  min-height: var(--run-control-height);
  padding-block: 0;
  border-radius: var(--radius-full);
}

.run-upload-actions :deep(.run-remove-image-button.p-button) {
  border-color: transparent;
  color: var(--color-dark);
  background: var(--color-accent-pale);
}

.run-upload-actions :deep(.run-remove-image-button.p-button:hover:not(:disabled)),
.run-upload-actions :deep(.run-remove-image-button.p-button:active:not(:disabled)) {
  border-color: transparent;
  color: var(--color-dark);
  background: var(--color-accent-soft);
}

.run-record-form :deep(.p-datepicker),
.run-record-form :deep(.p-inputnumber),
.run-record-form :deep(.p-select) {
  width: 100%;
  min-width: 0;
  min-height: var(--run-control-height);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-surface) 34%, transparent);
  box-shadow: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.run-record-form :deep(.p-datepicker:hover),
.run-record-form :deep(.p-inputnumber:hover),
.run-record-form :deep(.p-select:not(.p-disabled):hover) {
  border-color: var(--color-primary-light);
}

.run-record-form :deep(.p-datepicker:focus-within),
.run-record-form :deep(.p-inputnumber:focus-within),
.run-record-form :deep(.p-select.p-focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
  outline: none;
}

.run-record-form :deep(.p-datepicker .p-inputtext),
.run-record-form :deep(.p-inputnumber .p-inputtext) {
  width: 100%;
  height: calc(var(--run-control-height) - 2px);
  min-width: 0;
  padding: 0 var(--space-4);
  border: 0;
  border-radius: inherit;
  color: var(--color-text);
  background: transparent;
  box-shadow: none;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  letter-spacing: var(--letter-spacing-base);
}

.run-record-form :deep(.p-inputtext::placeholder),
.run-record-form :deep(.p-select-label.p-placeholder) {
  color: var(--color-text-secondary);
  opacity: 0.78;
}

.run-record-form :deep(.p-datepicker-dropdown),
.run-record-form :deep(.p-select-dropdown) {
  flex: 0 0 calc(var(--space-6) + var(--space-2));
  width: calc(var(--space-6) + var(--space-2));
  border: 0;
  border-radius: var(--radius-full);
  color: var(--color-dark-light);
  background: transparent;
  box-shadow: none;
}

.run-record-form :deep(.p-datepicker-dropdown:hover),
.run-record-form :deep(.p-select-dropdown:hover) {
  color: var(--color-dark);
  background: var(--color-primary-pale);
}

.run-record-form :deep(.p-select-label) {
  display: flex;
  align-items: center;
  min-width: 0;
  height: calc(var(--run-control-height) - 2px);
  padding: 0 0 0 var(--space-4);
  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  letter-spacing: var(--letter-spacing-base);
}

.run-record-form :deep(.p-selectbutton) {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
}

.run-weather-selector {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-full);
  background: transparent;
}

.run-weather-indicator-track {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 0;
  width: calc(100% / 3);
  pointer-events: none;
  transform: translateX(var(--weather-indicator-offset, 0%));
  transition: transform 300ms cubic-bezier(0.2, 0, 0, 1);
}

.run-weather-active-indicator {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-soft));
}

.run-record-form :deep(.p-selectbutton .p-togglebutton) {
  position: relative;
  z-index: 1;
  min-width: 0;
  min-height: var(--run-control-height);
  padding: 0 var(--space-2);
  border: 0;
  border-radius: var(--radius-full);
  color: var(--color-dark-light);
  background: transparent;
  box-shadow: none;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-base);
  transition: color 150ms ease;
}

.run-record-form :deep(.run-weather-select .p-togglebutton:not(.p-togglebutton-checked):hover) {
  color: var(--color-dark);
  background: transparent;
}

.run-record-form :deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked) {
  color: var(--color-surface);
  background: transparent;
}

.run-record-form :deep(.run-weather-select .p-togglebutton-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: transparent;
  box-shadow: none;
}

.run-record-form :deep(.p-selectbutton .p-togglebutton:focus-visible) {
  outline: 2px solid var(--color-dark-light);
  outline-offset: -3px;
}

:global(.run-select-overlay.p-select-overlay),
:global(.run-date-overlay.p-datepicker-panel) {
  border-radius: var(--radius-lg);
  color: var(--color-text);
  font-family: var(--font-family-base);
  letter-spacing: var(--letter-spacing-base);
}

:global(.run-date-overlay.p-datepicker-panel .p-datepicker-header) {
  border-color: transparent;
  background: transparent;
}

:global(.run-select-overlay .p-select-list) {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
}

:global(.run-select-overlay .p-select-option) {
  min-height: calc(var(--space-6) + var(--space-2));
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

:global(.run-select-overlay .p-select-option:not(.p-select-option-selected):hover),
:global(.run-select-overlay .p-select-option.p-focus:not(.p-select-option-selected)) {
  color: var(--color-dark);
  background: var(--color-primary-pale);
}

:global(.run-select-overlay .p-select-option.p-select-option-selected) {
  color: var(--color-dark);
  background: var(--color-secondary-pale);
}

@media (prefers-reduced-motion: reduce) {
  .run-weather-indicator-track {
    transition: none;
  }
}

@media (max-width: 639px) {
  .run-duration-grid {
    gap: var(--space-2);
  }

  .run-form-actions {
    flex-direction: column-reverse;
  }

  .run-form-actions > :deep(.p-button) {
    width: 100%;
  }

  .run-upload-actions > :deep(.p-button) {
    flex: 1 1 auto;
  }
}

@media (max-width: 480px) {
  .run-duration-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .run-duration-grid > :last-child {
    grid-column: 1 / -1;
  }
}
</style>
