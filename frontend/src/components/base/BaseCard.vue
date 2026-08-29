<script setup lang="ts">
interface Props {
  as?: 'article' | 'div' | 'section'
  variant?: 'default' | 'glass'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  variant: 'default',
})
</script>

<template>
  <component :is="props.as" class="base-card" :class="`base-card--${props.variant}`">
    <slot />
  </component>
</template>
