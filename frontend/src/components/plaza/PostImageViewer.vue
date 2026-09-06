<template>
  <Dialog
    :visible="visible"
    modal
    dismissable-mask
    :draggable="false"
    :header="`貼文照片 ${currentIndex + 1} / ${images.length}`"
    class="post-image-viewer"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="post-image-viewer__stage">
      <button
        v-if="images.length > 1"
        type="button"
        class="post-image-viewer__nav post-image-viewer__nav--previous"
        aria-label="查看上一張照片"
        @click="showPreviousImage"
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <img
        v-if="currentImage"
        :src="currentImage.url"
        :alt="`${authorName} 的貼文照片，第 ${currentIndex + 1} 張完整圖片`"
        class="post-image-viewer__image"
      />

      <button
        v-if="images.length > 1"
        type="button"
        class="post-image-viewer__nav post-image-viewer__nav--next"
        aria-label="查看下一張照片"
        @click="showNextImage"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>

    <div v-if="images.length > 1" class="post-image-viewer__thumbnails" aria-label="選擇照片">
      <button
        v-for="(image, index) in images"
        :key="`${image.url}-${index}`"
        type="button"
        class="post-image-viewer__thumbnail-button"
        :class="{ 'post-image-viewer__thumbnail-button--active': index === currentIndex }"
        :aria-label="`查看第 ${index + 1} 張照片`"
        :aria-current="index === currentIndex ? 'true' : undefined"
        @click="currentIndex = index"
      >
        <img :src="getThumbnailUrl(image.url)" alt="" class="post-image-viewer__thumbnail" />
      </button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import Dialog from 'primevue/dialog'

import type { PostImage } from '@/types/post'
import { getCloudinaryThumbnailUrl } from '@/utils/cloudinaryImage'

const props = defineProps<{
  visible: boolean
  images: PostImage[]
  initialIndex: number
  authorName: string
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

const currentIndex = ref(0)
const currentImage = computed(() => props.images[currentIndex.value])
const getThumbnailUrl = (url: string) =>
  getCloudinaryThumbnailUrl(url, {
    width: 160,
    height: 160,
  })

const showPreviousImage = () => {
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
}

const showNextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % props.images.length
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible || props.images.length <= 1) return

  if (event.key === 'ArrowLeft') showPreviousImage()
  if (event.key === 'ArrowRight') showNextImage()
}

watch(
  () => [props.visible, props.initialIndex, props.images.length] as const,
  ([visible, initialIndex, imageCount]) => {
    if (!visible) return

    currentIndex.value = Math.min(Math.max(initialIndex, 0), Math.max(imageCount - 1, 0))
  },
  { immediate: true },
)

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
:global(.post-image-viewer.p-dialog) {
  display: flex;
  width: min(72rem, calc(100vw - var(--space-7)));
  max-height: calc(100dvh - var(--space-7));
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

:global(.post-image-viewer .p-dialog-header) {
  flex: 0 0 auto;
  padding: var(--space-4) var(--space-5);
  color: var(--color-text);
  background: transparent;
}

:global(.post-image-viewer .p-dialog-title) {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-base);
}

:global(.post-image-viewer .p-dialog-content) {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-5) var(--space-5);
  background: transparent;
}

.post-image-viewer__stage {
  position: relative;
  display: grid;
  min-height: 0;
  flex: 1;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-dark);
}

.post-image-viewer__image {
  display: block;
  width: 100%;
  height: min(68dvh, 48rem);
  object-fit: contain;
}

.post-image-viewer__nav {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: grid;
  width: calc(var(--space-7) - var(--space-1));
  height: calc(var(--space-7) - var(--space-1));
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: var(--radius-full);
  color: var(--color-dark);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transform: translateY(-50%);
}

.post-image-viewer__nav--previous {
  inset-inline-start: var(--space-3);
}

.post-image-viewer__nav--next {
  inset-inline-end: var(--space-3);
}

.post-image-viewer__nav:hover {
  background: var(--color-primary-pale);
}

.post-image-viewer__nav:focus-visible,
.post-image-viewer__thumbnail-button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

.post-image-viewer__nav svg {
  width: 24px;
  height: 24px;
}

.post-image-viewer__thumbnails {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  overflow-x: auto;
  padding: var(--space-1);
  scrollbar-color: var(--color-primary-soft) transparent;
  scrollbar-width: thin;
}

.post-image-viewer__thumbnail-button {
  width: calc(var(--space-8) + var(--space-2));
  height: calc(var(--space-8) + var(--space-2));
  flex: 0 0 auto;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--color-background);
  cursor: pointer;
  opacity: 0.62;
}

.post-image-viewer__thumbnail-button--active {
  border-color: var(--color-primary);
  opacity: 1;
}

.post-image-viewer__thumbnail {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  :global(.post-image-viewer.p-dialog) {
    width: calc(100vw - var(--space-5));
    max-height: calc(100dvh - var(--space-5));
  }

  :global(.post-image-viewer .p-dialog-header) {
    padding: var(--space-3) var(--space-4);
  }

  :global(.post-image-viewer .p-dialog-content) {
    padding: 0 var(--space-3) var(--space-3);
  }

  .post-image-viewer__image {
    height: min(64dvh, 40rem);
  }

  .post-image-viewer__nav {
    width: calc(var(--space-6) + var(--space-2));
    height: calc(var(--space-6) + var(--space-2));
  }

  .post-image-viewer__nav--previous {
    inset-inline-start: var(--space-2);
  }

  .post-image-viewer__nav--next {
    inset-inline-end: var(--space-2);
  }
}
</style>
