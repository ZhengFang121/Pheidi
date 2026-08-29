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
    :aria-busy="loading || undefined"
    :pt="{
      label: { class: 'base-button__content base-button__label' },
      icon: { class: 'base-button__content' },
      loadingIcon: { class: 'base-button__content' },
    }"
    class="base-button"
    :class="`base-button--${variant}`"
  />
</template>
