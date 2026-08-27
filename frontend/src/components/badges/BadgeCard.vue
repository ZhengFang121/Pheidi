<script setup lang="ts">
import { Check, LockKeyhole, Medal } from '@lucide/vue'

import type { BadgeDefinition } from '@/types/runnerProgress'
import { formatNumericDate } from '@/utils/date'

defineProps<{
  badge: BadgeDefinition
  unlockedAt: string | null
}>()
</script>

<template>
  <article
    class="badge-card"
    :class="[`badge-card--${badge.category}`, { 'badge-card--locked': !unlockedAt }]"
  >
    <div class="badge-card__seal" aria-hidden="true">
      <span class="badge-card__seal-ring" />
      <Medal v-if="unlockedAt" :size="30" :stroke-width="1.7" />
      <LockKeyhole v-else :size="27" :stroke-width="1.7" />
    </div>

    <div class="badge-card__content">
      <span class="badge-card__status">
        <Check v-if="unlockedAt" :size="14" aria-hidden="true" />
        {{ unlockedAt ? '已解鎖' : '尚未解鎖' }}
      </span>

      <h3>{{ badge.name }}</h3>
      <p>{{ badge.description }}</p>
    </div>

    <time v-if="unlockedAt" :datetime="unlockedAt" class="badge-card__date">
      {{ formatNumericDate(unlockedAt, 'Asia/Taipei') }} 解鎖
    </time>
    <span v-else class="badge-card__date">完成條件後即可收藏</span>
  </article>
</template>

<style scoped>
.badge-card {
  --badge-color: var(--color-primary);
  --badge-soft: var(--color-primary-pale);

  display: flex;
  min-width: 0;
  min-height: 270px;
  padding: var(--space-4);
  flex-direction: column;
  align-items: center;

  text-align: center;

  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--badge-color) 32%, var(--color-border));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.badge-card--distance,
.badge-card--location {
  --badge-color: var(--color-secondary);
  --badge-soft: var(--color-secondary-pale);
}

.badge-card--time,
.badge-card--weather,
.badge-card--consistency {
  --badge-color: var(--color-accent);
  --badge-soft: var(--color-accent-pale);
}

.badge-card--mood,
.badge-card--memory {
  --badge-color: var(--color-dark-light);
  --badge-soft: color-mix(in srgb, var(--color-dark-pale) 24%, var(--color-surface));
}

.badge-card:not(.badge-card--locked):hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.badge-card--locked {
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-background) 72%, var(--color-surface));
  box-shadow: none;
}

.badge-card__seal {
  position: relative;

  display: grid;
  width: 78px;
  aspect-ratio: 1;
  margin-bottom: var(--space-3);
  place-items: center;

  color: var(--badge-color);

  background: var(--badge-soft);
  border: 2px solid color-mix(in srgb, var(--badge-color) 42%, transparent);
  border-radius: 50%;
}

.badge-card__seal-ring {
  position: absolute;
  inset: 7px;

  border: 1px dashed currentcolor;
  border-radius: 50%;
  opacity: 0.55;
}

.badge-card--locked .badge-card__seal {
  color: var(--color-text-secondary);
  background: var(--color-background);
  border-color: var(--color-border);
  filter: saturate(0);
  opacity: 0.72;
}

.badge-card__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
}

.badge-card__status {
  display: inline-flex;
  min-height: 22px;
  padding: var(--space-1) var(--space-2);
  align-items: center;
  gap: var(--space-1);

  color: var(--badge-color);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);

  background: var(--badge-soft);
  border-radius: var(--radius-full);
}

.badge-card--locked .badge-card__status {
  color: var(--color-text-secondary);
  background: var(--color-background);
}

.badge-card h3 {
  margin: var(--space-3) 0 var(--space-2);

  color: var(--color-text);
  font-size: var(--font-size-base);
  line-height: var(--line-height-heading);
}

.badge-card p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
}

.badge-card__date {
  margin-top: auto;
  padding-top: var(--space-3);

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

@media (prefers-reduced-motion: reduce) {
  .badge-card {
    transition: none;
  }
}
</style>
