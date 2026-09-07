<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'

defineProps<{
  loading: boolean
  disabled: boolean
}>()
</script>

<template>
  <BaseButton
    type="submit"
    label="儲存"
    icon="pi pi-check"
    :loading="loading"
    :disabled="disabled"
  />
</template>

<style scoped>
:deep(.p-button) {
  min-height: calc(var(--space-6) + var(--space-1));
  padding-block: 0;
  border-radius: var(--radius-full);
}

@media (max-width: 639px) {
  :deep(.p-button) {
    width: 100%;
  }
}
</style>
