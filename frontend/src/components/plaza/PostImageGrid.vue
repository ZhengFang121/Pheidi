<template>
  <div
    class="post-media-grid"
    :class="`post-media-grid--${layoutName}`"
    :aria-label="`${authorName} 的貼文照片，共 ${images.length} 張`"
  >
    <button
      v-for="(image, index) in images"
      :key="`${image.url}-${index}`"
      type="button"
      class="post-media-item"
      :aria-label="`查看第 ${index + 1} 張完整照片`"
      @click="emit('open', index)"
    >
      <img
        :src="getThumbnailUrl(image.url)"
        :alt="`${authorName} 的貼文照片，第 ${index + 1} 張`"
        class="post-media-image"
        loading="lazy"
        decoding="async"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { PostImage } from '@/types/post'
import { getCloudinaryThumbnailUrl } from '@/utils/cloudinaryImage'

const props = defineProps<{
  images: PostImage[]
  authorName: string
}>()

const emit = defineEmits<{
  open: [index: number]
}>()

const layoutName = computed(() => {
  if (props.images.length <= 1) return 'single'
  if (props.images.length === 2) return 'double'
  if (props.images.length === 3) return 'triple'

  return 'quad'
})

const getThumbnailUrl = (url: string) =>
  getCloudinaryThumbnailUrl(url, {
    width: props.images.length === 1 ? 960 : 640,
    height: props.images.length === 1 ? 720 : 640,
  })
</script>

<style scoped>
.post-media-grid {
  display: grid;
  width: min(100%, 40rem);
  overflow: hidden;
  gap: var(--space-1);
  border-radius: var(--radius-lg);
  background: var(--color-border);
}

.post-media-grid--single {
  aspect-ratio: 4 / 3;
}

.post-media-grid--double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  aspect-ratio: 2 / 1;
}

.post-media-grid--triple,
.post-media-grid--quad {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  height: clamp(18rem, 32vw, 24rem);
}

.post-media-grid--triple .post-media-item:first-child {
  grid-row: 1 / 3;
}

.post-media-item {
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  color: inherit;
  background: var(--color-background);
  cursor: zoom-in;
}

.post-media-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

@media (hover: hover) {
  .post-media-item:hover .post-media-image {
    transform: scale(1.025);
  }
}

.post-media-item:focus-visible {
  position: relative;
  z-index: 1;
  outline: 3px solid var(--color-primary);
  outline-offset: -3px;
}

@media (max-width: 640px) {
  .post-media-grid--triple,
  .post-media-grid--quad {
    height: clamp(14rem, 70vw, 20rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-media-image {
    transition: none;
  }

  .post-media-item:hover .post-media-image {
    transform: none;
  }
}
</style>
