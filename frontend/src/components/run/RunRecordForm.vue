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

import {
  RUN_LOCATION_OPTIONS,
  RUN_MOOD_OPTIONS,
  WEATHER_CONDITION_OPTIONS,
  type RunLocationType,
  type RunMood,
  type WeatherCondition,
  type WeatherSource,
} from '@/constants/runRecord'
import { createRunRecord, updateRunRecord, uploadRunRecordImage } from '@/services/runRecords'
import { getWeatherConditionForDate } from '@/services/weather'
import type { RunRecord } from '@/types/runRecord'
import { getRunRecordCoordinates, type RunRecordCoordinates } from '@/utils/geolocation'

const props = defineProps<{
  runRecord?: RunRecord
}>()

const emit = defineEmits<{
  submitted: [runRecord: RunRecord]
  cancel: []
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

    emit('submitted', response.runRecord)
  } catch (error: unknown) {
    submitError.value = getApiErrorMessage(error, '跑步紀錄儲存失敗，請稍後再試。')
  } finally {
    submitting.value = false
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
    <div class="run-form-field">
      <label for="run-date" class="run-form-label">跑步日期與時間</label>

      <DatePicker
        id="run-date"
        v-model="runDate"
        :max-date="maxRunDate"
        date-format="yy/mm/dd"
        hour-format="24"
        show-time
        show-icon
        fluid
      />

      <small class="text-surface-500"> 可以補登過去的跑步紀錄，但不能選擇未來時間。 </small>
    </div>

    <div class="run-form-field">
      <label for="run-location" class="run-form-label">跑步地點</label>

      <Select
        id="run-location"
        v-model="locationType"
        :options="runLocationOptions"
        option-label="label"
        option-value="value"
        placeholder="請選擇跑步地點"
        fluid
      />
    </div>

    <div class="run-form-field">
      <label for="run-distance" class="run-form-label">跑步距離</label>

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
      <legend class="run-form-label">跑步時長</legend>

      <div class="run-duration-grid">
        <InputNumber v-model="durationHours" :min="0" :max="99" suffix=" 小時" fluid />

        <InputNumber v-model="durationMinutes" :min="0" :max="59" suffix=" 分" fluid />

        <InputNumber v-model="durationSeconds" :min="0" :max="59" suffix=" 秒" fluid />
      </div>
    </fieldset>

    <div class="run-form-field">
      <label for="run-mood" class="run-form-label">跑步心情</label>

      <Select
        id="run-mood"
        v-model="mood"
        :options="runMoodOptions"
        option-label="label"
        option-value="value"
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

    <div class="run-form-field">
      <div>
        <p class="run-form-heading">跑步照片（選填）</p>

        <small class="text-surface-500"> 支援 JPG、PNG、WebP、GIF，檔案最大 5 MB。 </small>
      </div>

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

      <div class="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          :label="imagePreviewUrl ? '更換照片' : '選擇照片'"
          icon="pi pi-image"
          severity="secondary"
          outlined
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
          :disabled="submitting"
          @click="clearImage"
        />
      </div>

      <Message v-if="imageErrorMessage" severity="error" :closable="false">
        {{ imageErrorMessage }}
      </Message>
    </div>

    <div class="run-form-field">
      <p class="run-form-heading">天氣</p>

      <SelectButton
        :model-value="weatherCondition"
        :options="weatherConditionOptions"
        option-label="label"
        option-value="value"
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

      <small v-if="weatherLoading" class="text-surface-500"> 正在取得天氣…… </small>
    </div>

    <Message v-if="submitError" severity="error" :closable="false">
      {{ submitError }}
    </Message>

    <div class="run-form-actions">
      <Button
        type="button"
        label="取消"
        severity="secondary"
        outlined
        :disabled="submitting"
        @click="emit('cancel')"
      />

      <Button
        type="submit"
        :label="isEditMode ? '儲存修改' : '儲存跑步紀錄'"
        icon="pi pi-check"
        :loading="submitting"
      />
    </div>
  </form>
</template>

<style scoped>
.run-record-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);

  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
}

.run-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.run-form-heading,
.run-form-label {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}

.run-duration-fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;

  border: 0;
}

.run-duration-fieldset > .run-form-label {
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

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.run-image-preview__image {
  display: block;
  width: 100%;
  max-height: 320px;

  object-fit: contain;
}

@media (max-width: 639px) {
  .run-record-form {
    gap: var(--space-5);
    padding: var(--space-5) var(--space-4);
  }

  .run-duration-grid {
    gap: var(--space-2);
  }

  .run-form-actions {
    flex-direction: column-reverse;
  }

  .run-form-actions > :deep(.p-button) {
    width: 100%;
  }
}
</style>
