<script setup lang="ts">
import { Check, LockKeyhole } from '@lucide/vue'

import BadgeImage from '@/components/badges/BadgeImage.vue'
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
    <BadgeImage
      class="badge-card__image"
      :name="badge.name"
      :image-path="badge.imagePath"
      :unlocked="Boolean(unlockedAt)"
    />

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
  --badge-color: var(--color-secondary);
  --badge-soft: var(--color-secondary-pale);

  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 192px;
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
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.badge-card--growth {
  --badge-color: var(--color-primary);
  --badge-soft: var(--color-primary-pale);
}

.badge-card--special {
  --badge-color: var(--color-accent);
  --badge-soft: var(--color-accent-pale);
}

.badge-card:hover {
  background: color-mix(in srgb, var(--badge-soft) 38%, transparent);
  box-shadow: var(--shadow-sm);
}

.badge-card:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 2px;
}

.badge-card__image {
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1);
}

.badge-card:hover .badge-card__image {
  transform: translateY(-4px) scale(1.03);
}

.badge-card:active .badge-card__image {
  transform: translateY(-1px) scale(0.99);
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
  margin: var(--space-2) 0 var(--space-1);
  overflow-wrap: anywhere;

  color: var(--color-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}

@media (max-width: 600px) {
  .badge-card {
    min-height: 164px;
    padding-inline: var(--space-2);
  }

  .badge-card__image {
    --badge-image-size: 84px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge-card,
  .badge-card__image {
    transition: none;
  }

  .badge-card:hover .badge-card__image,
  .badge-card:active .badge-card__image {
    transform: none;
  }
}
</style>
