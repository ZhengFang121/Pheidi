<script setup lang="ts">
import Button from 'primevue/button'

interface Props {
  label: string
  variant?: 'primary' | 'secondary' | 'outline'
  icon?: string
  disabled?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  icon: '',
  disabled: false,
  loading: false,
})
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :disabled="disabled"
    :loading="loading"
    class="base-button"
    :class="`base-button--${variant}`"
  />
</template>