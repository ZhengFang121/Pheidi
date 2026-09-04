<script setup lang="ts">
import { LockKeyhole, Mail, Route, Sparkles } from '@lucide/vue'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'

import BaseCard from '@/components/base/BaseCard.vue'
import type { RunnerStats } from '@/types/runnerProgress'

defineProps<{
  stats: RunnerStats | null
  eligible: boolean
  loading: boolean
}>()

const formatDistance = (distance: number) =>
  distance.toLocaleString('zh-TW', { maximumFractionDigits: 2 })
</script>

<template>
  <section class="pheidi-journey" aria-labelledby="pheidi-journey-title">
    <header class="pheidi-journey__header">
      <p>RUNNER JOURNEY</p>
      <h2 id="pheidi-journey-title">我的跑者旅程</h2>
    </header>

    <BaseCard v-if="loading" class="pheidi-journey__card" aria-label="跑者旅程載入中">
      <Skeleton shape="circle" size="4.5rem" />
      <div class="pheidi-journey__loading-copy">
        <Skeleton width="11rem" height="1.5rem" />
        <Skeleton width="min(100%, 30rem)" height="1rem" />
      </div>
    </BaseCard>

    <BaseCard
      v-else-if="stats"
      as="article"
      class="pheidi-journey__card"
      :class="{ 'pheidi-journey__card--eligible': eligible }"
    >
      <div class="pheidi-journey__icon" aria-hidden="true">
        <Mail v-if="eligible" :size="34" :stroke-width="1.6" />
        <LockKeyhole v-else :size="30" :stroke-width="1.6" />
      </div>

      <div class="pheidi-journey__content">
        <span class="pheidi-journey__status">
          <Sparkles v-if="eligible" :size="15" aria-hidden="true" />
          {{ eligible ? '已符合解鎖資格' : '尚未解鎖' }}
        </span>

        <h3>{{ eligible ? '✉️ 你收到了一封信。' : '尚未抵達的旅程' }}</h3>
        <p v-if="eligible">寄件人：菲迪</p>
        <p v-else>當你走得足夠遠，也許會有人為你留下一封信。</p>

        <div v-if="!eligible" class="pheidi-journey__progress" aria-label="未解鎖旅程條件進度">
          <span>
            <Route :size="16" aria-hidden="true" />
            跑步 {{ stats.runCount }} / 50 次
          </span>
          <span>距離 {{ formatDistance(stats.totalDistance) }} / 250 km</span>
        </div>

        <!-- TODO: 第二階段串接 PheidiJourney -->
        <Button
          v-if="eligible"
          type="button"
          label="打開邀請函"
          icon="pi pi-envelope"
          disabled
          class="pheidi-journey__button"
        />
      </div>
    </BaseCard>
  </section>
</template>

<style scoped>
.pheidi-journey {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.pheidi-journey__header p {
  margin: 0 0 var(--space-2);

  color: var(--color-dark-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
}

.pheidi-journey__header h2 {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-heading);
}

.pheidi-journey__card {
  display: flex;
  min-height: 190px;
  padding: var(--space-6);
  align-items: center;
  gap: var(--space-5);

  border-radius: var(--radius-xl);
}

.pheidi-journey__card--eligible {
  border-color: var(--color-accent-soft);
}

.pheidi-journey__icon {
  display: grid;
  width: 88px;
  aspect-ratio: 1;
  flex: 0 0 auto;
  place-items: center;

  color: var(--color-text-secondary);

  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 50%;
}

.pheidi-journey__card--eligible .pheidi-journey__icon {
  color: var(--color-accent);

  background: var(--color-surface);
  border-color: var(--color-accent-soft);
}

.pheidi-journey__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.pheidi-journey__status {
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  align-items: center;
  gap: var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);

  background: var(--color-background);
  border-radius: var(--radius-full);
}

.pheidi-journey__card--eligible .pheidi-journey__status {
  color: var(--color-dark);
  background: var(--color-surface);
}

.pheidi-journey h3 {
  margin: var(--space-3) 0 var(--space-2);

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.pheidi-journey__content > p {
  max-width: 680px;
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.pheidi-journey__progress {
  display: flex;
  margin-top: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pheidi-journey__progress span {
  display: inline-flex;
  padding: var(--space-2) var(--space-3);
  align-items: center;
  gap: var(--space-1);

  color: var(--color-text);
  font-size: var(--font-size-sm);

  background: var(--color-primary-pale);
  border-radius: var(--radius-full);
}

.pheidi-journey__button {
  margin-top: var(--space-4);
}

.pheidi-journey__loading-copy {
  display: grid;
  width: 100%;
  gap: var(--space-3);
}

@media (max-width: 600px) {
  .pheidi-journey__header h2 {
    font-size: var(--font-size-md);
  }

  .pheidi-journey__card {
    padding: var(--space-5) var(--space-4);
    align-items: flex-start;
    flex-direction: column;

    border-radius: var(--radius-lg);
  }

  .pheidi-journey__icon {
    width: 68px;
  }
}
</style>
