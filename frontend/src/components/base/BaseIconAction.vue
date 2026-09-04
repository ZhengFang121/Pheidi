<script setup lang="ts">
interface Props {
  as?: 'a' | 'button'
  label: string
  ariaLabel?: string
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  ariaLabel: undefined,
  type: 'button',
})
</script>

<template>
  <component
    :is="props.as"
    :type="props.as === 'button' ? props.type : undefined"
    :aria-label="props.ariaLabel ?? props.label"
    class="base-icon-action"
  >
    <span class="base-icon-action__icon" aria-hidden="true">
      <slot name="icon" />
    </span>

    <span class="base-icon-action__label">
      <slot name="label">{{ props.label }}</slot>
    </span>
  </component>
</template>
