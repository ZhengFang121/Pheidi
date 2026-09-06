<template>
  <Dialog
    id="create-activity-dialog"
    :visible="visible"
    modal
    header="發起活動"
    :draggable="false"
    :closable="!isSubmitting"
    :close-on-escape="!isSubmitting"
    :pt="{ mask: { class: 'run-record-dialog-mask' } }"
    class="run-record-dialog create-activity-dialog"
    @update:visible="handleVisibleChange"
  >
    <EventForm
      v-if="visible"
      dialog
      :is-submitting="isSubmitting"
      :error-message="submitError"
      @submit="handleSubmit"
      @cancel="closeDialog"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

import EventForm from '@/components/events/EventForm.vue'
import { createEvent } from '@/services/events'
import type { EventFormPayload, RunningEvent } from '@/types/event'
import { getApiErrorMessage } from '@/utils/apiError'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  created: [event: RunningEvent]
}>()

const toast = useToast()
const isSubmitting = ref(false)
const submitError = ref('')

function handleVisibleChange(visible: boolean) {
  if (!visible) submitError.value = ''

  emit('update:visible', visible)
}

function closeDialog() {
  handleVisibleChange(false)
}

async function handleSubmit(payload: EventFormPayload) {
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = await createEvent(payload)

    closeDialog()
    emit('created', response.event)

    toast.add({
      severity: 'success',
      summary: '活動建立成功',
      detail: '新活動已加入活動情報。',
      life: 3000,
    })
  } catch (error: unknown) {
    submitError.value = getApiErrorMessage(error, '建立活動失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}
</script>
