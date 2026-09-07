<template>
  <Dialog
    id="activity-form-dialog"
    :visible="visible"
    modal
    :header="isEditMode ? '編輯活動' : '發起活動'"
    :draggable="false"
    :closable="!isSubmitting"
    :close-on-escape="!isSubmitting"
    :pt="{ mask: { class: 'run-record-dialog-mask' } }"
    class="run-record-dialog activity-form-dialog"
    @update:visible="handleVisibleChange"
  >
    <EventForm
      v-if="visible"
      :key="`${mode}:${activity?.id ?? 'new'}`"
      dialog
      :mode="mode"
      :initial-event="activity ?? undefined"
      :is-submitting="isSubmitting"
      :error-message="submitError"
      @submit="handleSubmit"
      @cancel="closeDialog"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

import EventForm from '@/components/events/EventForm.vue'
import { createEvent, updateEvent } from '@/services/events'
import type { EventFormPayload, RunningEvent } from '@/types/event'
import { getApiErrorMessage } from '@/utils/apiError'

type ActivityFormMode = 'create' | 'edit'

const props = withDefaults(
  defineProps<{
    visible: boolean
    mode?: ActivityFormMode
    activity?: RunningEvent | null
  }>(),
  {
    mode: 'create',
    activity: null,
  },
)

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [event: RunningEvent]
}>()

const toast = useToast()
const isSubmitting = ref(false)
const submitError = ref('')
const isEditMode = computed(() => props.mode === 'edit')

function handleVisibleChange(visible: boolean) {
  if (!visible) submitError.value = ''

  emit('update:visible', visible)
}

function closeDialog() {
  handleVisibleChange(false)
}

async function handleSubmit(payload: EventFormPayload) {
  if (isSubmitting.value) return

  if (isEditMode.value && !props.activity) {
    submitError.value = '找不到要編輯的活動，請關閉表單後再試。'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = isEditMode.value
      ? await updateEvent(props.activity!.id, payload)
      : await createEvent(payload)

    emit('saved', response.event)

    toast.add({
      severity: 'success',
      summary: isEditMode.value ? '活動修改成功' : '活動建立成功',
      detail: isEditMode.value ? '活動資訊已更新。' : '新活動已加入活動情報。',
      life: 3000,
    })

    closeDialog()
  } catch (error: unknown) {
    submitError.value = getApiErrorMessage(
      error,
      isEditMode.value ? '更新活動失敗，請稍後再試。' : '建立活動失敗，請稍後再試。',
    )
  } finally {
    isSubmitting.value = false
  }
}
</script>
