<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  name: string
  imagePath: string
  unlocked: boolean
}>()

const hasImageError = ref(false)

watch(
  () => props.imagePath,
  () => {
    hasImageError.value = false
  },
)

const handleImageError = () => {
  hasImageError.value = true

  if (import.meta.env.DEV) {
    console.warn(`Badge image failed to load: ${props.imagePath}`)
  }
}
</script>

<template>
  <span class="badge-image" :class="{ 'badge-image--locked': !unlocked }">
    <img
      v-if="!hasImageError"
      :src="imagePath"
      :alt="`${name}徽章${unlocked ? '' : '，尚未解鎖'}`"
      width="112"
      height="112"
      loading="lazy"
      decoding="async"
      @error="handleImageError"
    />
    <span
      v-else
      class="badge-image__fallback"
      role="img"
      :aria-label="`${name}徽章圖片暫時無法顯示${unlocked ? '' : '，尚未解鎖'}`"
    >
      圖片暫時無法顯示
    </span>
  </span>
</template>

<style scoped>
.badge-image {
  display: grid;
  width: var(--badge-image-size, 112px);
  height: var(--badge-image-size, 112px);
  flex: 0 0 auto;
  place-items: center;
}

.badge-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(60, 67, 94, 0.08));
}

.badge-image--locked img {
  filter: grayscale(1) saturate(0.15) contrast(0.88);
  opacity: 0.35;
}

.badge-image__fallback {
  display: grid;
  width: 100%;
  height: 100%;
  padding: var(--space-2);
  place-items: center;

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-heading);
  text-align: center;

  background: var(--color-background);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.badge-image--locked .badge-image__fallback {
  opacity: 0.6;
}
</style>
