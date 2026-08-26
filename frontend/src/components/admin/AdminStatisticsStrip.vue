<template>
  <div class="statistics-strip" role="region" :aria-label="label">
    <article v-for="item in items" :key="item.label" class="statistic-card">
      <div class="statistic-heading">
        <i :class="item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </div>

      <Skeleton v-if="loading" width="5rem" height="1.75rem" />
      <strong v-else class="statistic-value">
        {{ item.value.toLocaleString('zh-TW') }}
      </strong>
    </article>
  </div>
</template>

<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

interface AdminStatisticItem {
  label: string
  value: number
  icon: string
}

withDefaults(
  defineProps<{
    items: AdminStatisticItem[]
    label: string
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)
</script>

<style scoped>
.statistics-strip {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 1px;

  overflow: hidden;

  background: var(--color-border);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.statistic-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-4);

  background: var(--color-surface);
}

.statistic-card:first-child {
  border-left: 4px solid var(--color-primary);
}

.statistic-heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.statistic-heading i {
  color: var(--color-primary);
}

.statistic-value {
  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-tight);
}

@media (max-width: 1100px) {
  .statistics-strip {
    grid-auto-flow: row;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .statistics-strip {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
