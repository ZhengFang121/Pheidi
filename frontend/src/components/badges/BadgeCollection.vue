<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, LockKeyhole, Medal } from '@lucide/vue'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'

import BadgeCard from '@/components/badges/BadgeCard.vue'
import type { BadgeDefinition, UnlockedBadge } from '@/types/runnerProgress'
import { formatNumericDate } from '@/utils/date'

const props = defineProps<{
  definitions: BadgeDefinition[]
  unlockedBadges: UnlockedBadge[]
  loading: boolean
}>()

const unlockedBadgeDates = computed(
  () => new Map(props.unlockedBadges.map((badge) => [badge.key, badge.unlockedAt])),
)

const selectedBadge = ref<{
  definition: BadgeDefinition
  unlockedAt: string | null
} | null>(null)
const isBadgeDialogVisible = ref(false)

const openBadgeDialog = (definition: BadgeDefinition, unlockedAt: string | null) => {
  selectedBadge.value = { definition, unlockedAt }
  isBadgeDialogVisible.value = true
}
</script>

<template>
  <section class="badge-collection" aria-labelledby="badge-collection-title">
    <Dialog
      v-model:visible="isBadgeDialogVisible"
      modal
      header="徽章詳情"
      :draggable="false"
      :style="{ width: '30rem' }"
      :breakpoints="{ '600px': 'calc(100vw - 32px)' }"
      @hide="selectedBadge = null"
    >
      <article v-if="selectedBadge" class="badge-dialog">
        <div
          class="badge-dialog__seal"
          :class="[
            `badge-dialog__seal--${selectedBadge.definition.category}`,
            { 'badge-dialog__seal--locked': !selectedBadge.unlockedAt },
          ]"
          aria-hidden="true"
        >
          <span />
          <Medal v-if="selectedBadge.unlockedAt" :size="38" :stroke-width="1.7" />
          <LockKeyhole v-else :size="34" :stroke-width="1.7" />
        </div>

        <div class="badge-dialog__heading">
          <span class="badge-dialog__status">
            <Check v-if="selectedBadge.unlockedAt" :size="15" aria-hidden="true" />
            <LockKeyhole v-else :size="14" aria-hidden="true" />
            {{ selectedBadge.unlockedAt ? '已解鎖' : '尚未解鎖' }}
          </span>
          <h3>{{ selectedBadge.definition.name }}</h3>
        </div>

        <dl class="badge-dialog__details">
          <div>
            <dt>解鎖條件</dt>
            <dd>{{ selectedBadge.definition.description }}</dd>
          </div>
          <div v-if="selectedBadge.unlockedAt">
            <dt>解鎖日期</dt>
            <dd>
              <time :datetime="selectedBadge.unlockedAt">
                {{ formatNumericDate(selectedBadge.unlockedAt, 'Asia/Taipei') }}
              </time>
            </dd>
          </div>
        </dl>
      </article>
    </Dialog>

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
        height="11.25rem"
        border-radius="var(--radius-md)"
      />
    </div>

    <div v-else-if="definitions.length" class="badge-collection__grid">
      <BadgeCard
        v-for="badge in definitions"
        :key="badge.key"
        :badge="badge"
        :unlocked-at="unlockedBadgeDates.get(badge.key) ?? null"
        @select="openBadgeDialog(badge, unlockedBadgeDates.get(badge.key) ?? null)"
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
  padding: var(--space-2);
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-1);

  background: color-mix(in srgb, var(--color-primary-pale) 36%, var(--color-surface));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.badge-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);

  text-align: center;
}

.badge-dialog__seal {
  --badge-dialog-color: var(--color-primary);
  --badge-dialog-soft: var(--color-primary-pale);

  position: relative;

  display: grid;
  width: 96px;
  aspect-ratio: 1;
  place-items: center;

  color: var(--badge-dialog-color);

  background: var(--badge-dialog-soft);
  border: 2px solid color-mix(in srgb, var(--badge-dialog-color) 42%, transparent);
  border-radius: 50%;
}

.badge-dialog__seal--distance,
.badge-dialog__seal--location {
  --badge-dialog-color: var(--color-secondary);
  --badge-dialog-soft: var(--color-secondary-pale);
}

.badge-dialog__seal--time,
.badge-dialog__seal--weather,
.badge-dialog__seal--consistency {
  --badge-dialog-color: var(--color-accent);
  --badge-dialog-soft: var(--color-accent-pale);
}

.badge-dialog__seal--mood,
.badge-dialog__seal--memory {
  --badge-dialog-color: var(--color-dark-light);
  --badge-dialog-soft: color-mix(in srgb, var(--color-dark-pale) 24%, var(--color-surface));
}

.badge-dialog__seal > span {
  position: absolute;
  inset: var(--space-2);

  border: 1px dashed currentcolor;
  border-radius: 50%;
  opacity: 0.55;
}

.badge-dialog__seal--locked {
  color: var(--color-text-secondary);

  background: var(--color-background);
  border-color: var(--color-border);
  filter: saturate(0);
}

.badge-dialog__heading {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
}

.badge-dialog__heading h3 {
  margin: 0;
  overflow-wrap: anywhere;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.badge-dialog__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.badge-dialog__details {
  display: grid;
  width: 100%;
  margin: 0;
  gap: var(--space-3);

  text-align: left;
}

.badge-dialog__details > div {
  padding: var(--space-3) var(--space-4);

  background: var(--color-background);
  border-radius: var(--radius-md);
}

.badge-dialog__details dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.badge-dialog__details dd {
  margin: var(--space-1) 0 0;
  overflow-wrap: anywhere;

  color: var(--color-text);
  line-height: var(--line-height-base);
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
    padding: var(--space-1);
  }

  .badge-collection__count {
    align-self: flex-start;
  }
}
</style>
