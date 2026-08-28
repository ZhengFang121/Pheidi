<script setup lang="ts">
import { Check, LockKeyhole, Medal } from '@lucide/vue'

import type { BadgeDefinition } from '@/types/runnerProgress'

defineProps<{
  badge: BadgeDefinition
  unlockedAt: string | null
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="badge-card"
    :class="[`badge-card--${badge.category}`, { 'badge-card--locked': !unlockedAt }]"
    :aria-label="`查看${badge.name}徽章詳情，${unlockedAt ? '已解鎖' : '尚未解鎖'}`"
    @click="emit('select')"
  >
    <div class="badge-card__seal" aria-hidden="true">
      <span class="badge-card__seal-ring" />
      <Medal v-if="unlockedAt" :size="30" :stroke-width="1.7" />
      <LockKeyhole v-else :size="27" :stroke-width="1.7" />
    </div>

    <span class="badge-card__name">{{ badge.name }}</span>

    <span class="badge-card__status">
      <Check v-if="unlockedAt" :size="14" aria-hidden="true" />
      <LockKeyhole v-else :size="13" aria-hidden="true" />
      {{ unlockedAt ? '已解鎖' : '尚未解鎖' }}
    </span>
  </button>
</template>

<style scoped>
.badge-card {
  --badge-color: var(--color-primary);
  --badge-soft: var(--color-primary-pale);

  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 180px;
  padding: var(--space-3);
  flex-direction: column;
  align-items: center;
  justify-content: center;

  color: var(--color-text);
  font-family: inherit;
  letter-spacing: inherit;
  text-align: center;

  cursor: pointer;

  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);

  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
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

.badge-card:hover {
  background: var(--color-surface);
  border-color: var(--color-border);
  transform: translateY(-2px);
}

.badge-card:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 2px;
}

.badge-card--locked {
  color: var(--color-text-secondary);
  opacity: 0.68;
}

.badge-card__seal {
  position: relative;

  display: grid;
  width: 72px;
  aspect-ratio: 1;
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
  opacity: 0.82;
}

.badge-card__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);

  color: var(--badge-color);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.badge-card--locked .badge-card__status {
  color: var(--color-text-secondary);
}

.badge-card__name {
  max-width: 100%;
  margin: var(--space-3) 0 var(--space-1);
  overflow-wrap: anywhere;

  color: var(--color-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}

@media (prefers-reduced-motion: reduce) {
  .badge-card {
    transition: none;
  }
}
</style>
