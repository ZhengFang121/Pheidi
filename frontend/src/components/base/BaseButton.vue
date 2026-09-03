<script setup lang="ts">
import Button from 'primevue/button'

interface Props {
  label: string
  variant?: 'primary' | 'secondary' | 'outline'
  type?: 'button' | 'submit' | 'reset'
  icon?: string
  iconPos?: 'left' | 'right' | 'top' | 'bottom'
  disabled?: boolean
  loading?: boolean
  fluid?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  icon: '',
  iconPos: 'left',
  disabled: false,
  loading: false,
  fluid: false,
})
</script>

<template>
  <Button
    :label="label"
    :type="type"
    :icon="icon"
    :icon-pos="iconPos"
    :disabled="disabled"
    :loading="loading"
    :fluid="fluid"
    :aria-busy="loading || undefined"
    :pt="{
      label: { class: 'base-button__content base-button__label' },
      icon: { class: 'base-button__content' },
      loadingIcon: { class: 'base-button__content' },
    }"
    class="base-button"
    :class="`base-button--${variant}`"
  >
    <template v-if="$slots.icon" #icon>
      <span class="base-button__content">
        <slot name="icon" />
      </span>
    </template>
  </Button>
</template>
