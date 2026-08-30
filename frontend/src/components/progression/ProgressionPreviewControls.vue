<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, FlaskConical, Play } from '@lucide/vue'

import BaseCard from '@/components/base/BaseCard.vue'
import { useProgressionEvents } from '@/composables/useProgressionEvents'
import type { ProgressionEvent } from '@/types/progressionEvent'

const { enqueueProgressionEvents, isProgressionActive } = useProgressionEvents()

const isExpanded = ref(false)

const previewBadges: ProgressionEvent[] = [
  {
    type: 'badge',
    badgeKey: 'preview-first-run',
    name: '啟程之印',
    description: '完成第 1 次跑步紀錄',
  },
  {
    type: 'badge',
    badgeKey: 'preview-three-kilometers',
    name: '三公里的約定',
    description: '單次跑步距離至少 3 公里',
  },
  {
    type: 'badge',
    badgeKey: 'preview-five-kilometers',
    name: '五公里遠征',
    description: '單次跑步距離至少 5 公里',
  },
]

const previewLevel: ProgressionEvent = {
  type: 'level',
  fromLevel: 2,
  fromName: '習跑者',
  toLevel: 3,
  toName: '冒險者',
  description: '你的旅程又向前了一步。',
}

const previews: Array<{
  label: string
  events: ProgressionEvent[]
}> = [
  {
    label: '預覽單枚徽章',
    events: [previewBadges[0]!],
  },
  {
    label: '預覽 3 枚徽章',
    events: previewBadges,
  },
  {
    label: '預覽階段提升',
    events: [previewLevel],
  },
  {
    label: '預覽完整流程',
    events: [...previewBadges, previewLevel],
  },
]
</script>

<template>
  <aside class="progression-preview" aria-label="成就動畫開發預覽工具">
    <button
      type="button"
      class="progression-preview__toggle"
      :aria-expanded="isExpanded"
      aria-controls="progression-preview-options"
      @click="isExpanded = !isExpanded"
    >
      <FlaskConical :size="17" aria-hidden="true" />
      動畫預覽
      <ChevronDown
        :size="16"
        aria-hidden="true"
        :class="{ 'progression-preview__chevron--expanded': isExpanded }"
      />
    </button>

    <BaseCard v-if="isExpanded" id="progression-preview-options" class="progression-preview__panel">
      <p>Development only</p>

      <button
        v-for="preview in previews"
        :key="preview.label"
        type="button"
        :disabled="isProgressionActive"
        @click="enqueueProgressionEvents(preview.events)"
      >
        <Play :size="14" fill="currentColor" aria-hidden="true" />
        {{ preview.label }}
      </button>
    </BaseCard>
  </aside>
</template>

<style scoped>
.progression-preview {
  position: fixed;
  z-index: 1200;
  right: var(--space-4);
  bottom: var(--space-4);

  display: grid;
  justify-items: end;
  gap: var(--space-2);

  font-family: var(--font-family-base);
}

.progression-preview__toggle,
.progression-preview__panel button {
  display: inline-flex;
  min-height: 40px;
  padding: var(--space-2) var(--space-3);
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  color: var(--color-text);
  font-family: inherit;
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-tight);

  cursor: pointer;

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.progression-preview__toggle svg:last-child {
  transition: transform 0.2s ease;
}

.progression-preview__chevron--expanded {
  transform: rotate(180deg);
}

.progression-preview__panel {
  display: grid;
  width: min(240px, calc(100vw - 32px));
  padding: var(--space-3);
  gap: var(--space-2);

  border-radius: var(--radius-lg);
}

.progression-preview__panel p {
  margin: 0 0 var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
}

.progression-preview__panel button {
  width: 100%;
  justify-content: flex-start;

  font-size: var(--font-size-sm);

  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: none;
}

.progression-preview__toggle:hover,
.progression-preview__panel button:hover:not(:disabled) {
  background: var(--color-primary-pale);
  border-color: var(--color-primary);
}

.progression-preview__toggle:focus-visible,
.progression-preview__panel button:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 2px;
}

.progression-preview__panel button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .progression-preview__toggle svg:last-child {
    transition: none;
  }
}
</style>
