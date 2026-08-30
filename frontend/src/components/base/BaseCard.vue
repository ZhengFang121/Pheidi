<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  as?: string | Component
  variant?: 'default' | 'glass'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  variant: 'glass',
})
</script>

<template>
  <component :is="props.as" class="base-card" :class="`base-card--${props.variant}`">
    <slot />
  </component>
</template>
