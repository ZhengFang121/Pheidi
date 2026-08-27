<script setup lang="ts">
import { computed } from 'vue'
import Skeleton from 'primevue/skeleton'

import BadgeCard from '@/components/badges/BadgeCard.vue'
import type { BadgeDefinition, UnlockedBadge } from '@/types/runnerProgress'

const props = defineProps<{
  definitions: BadgeDefinition[]
  unlockedBadges: UnlockedBadge[]
  loading: boolean
}>()

const unlockedBadgeDates = computed(
  () => new Map(props.unlockedBadges.map((badge) => [badge.key, badge.unlockedAt])),
)
</script>

<template>
  <section class="badge-collection" aria-labelledby="badge-collection-title">
    <header class="badge-collection__header">
      <div>
        <p class="badge-collection__eyebrow">ACHIEVEMENTS</p>
        <h2 id="badge-collection-title">成就徽章</h2>
        <p>收藏一路走來的每一次突破。</p>
      </div>

      <strong class="badge-collection__count" aria-live="polite">
        已取得 {{ unlockedBadges.length }} / {{ definitions.length || 20 }}
      </strong>
    </header>

    <div v-if="loading" class="badge-collection__grid" aria-label="成就徽章載入中">
      <Skeleton
        v-for="index in 10"
        :key="index"
        height="16.875rem"
        border-radius="var(--radius-lg)"
      />
    </div>

    <div v-else-if="definitions.length" class="badge-collection__grid">
      <BadgeCard
        v-for="badge in definitions"
        :key="badge.key"
        :badge="badge"
        :unlocked-at="unlockedBadgeDates.get(badge.key) ?? null"
      />
    </div>

    <p v-else class="badge-collection__empty">目前沒有可顯示的徽章定義。</p>
  </section>
</template>

<style scoped>
.badge-collection {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.badge-collection__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
}

.badge-collection__eyebrow {
  margin: 0 0 var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
}

.badge-collection__header h2 {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-heading);
}

.badge-collection__header > div > p:last-child {
  margin: var(--space-2) 0 0;

  color: var(--color-text-secondary);
}

.badge-collection__count {
  padding: var(--space-2) var(--space-4);

  color: var(--color-text);
  font-size: var(--font-size-sm);
  white-space: nowrap;

  background: var(--color-primary-pale);
  border-radius: var(--radius-full);
}

.badge-collection__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-3);
}

.badge-collection__empty {
  margin: 0;
  padding: var(--space-6);

  color: var(--color-text-secondary);
  text-align: center;

  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

@media (max-width: 1200px) {
  .badge-collection__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .badge-collection__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .badge-collection__header {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-3);
  }

  .badge-collection__header h2 {
    font-size: var(--font-size-md);
  }

  .badge-collection__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .badge-collection__count {
    align-self: flex-start;
  }
}
</style>
