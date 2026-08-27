<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Check, MapPinned, Medal, Route, Sparkles } from '@lucide/vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'

import type {
  NumericRequirementProgress,
  RunnerLevelRequirements,
  RunnerProgress,
} from '@/types/runnerProgress'
import { formatNumericDate } from '@/utils/date'

const props = defineProps<{
  progress: RunnerProgress | null
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  retry: []
}>()

interface RequirementPresentation {
  key: Exclude<keyof RunnerLevelRequirements, 'pheidiMission'>
  label: string
  unit: string
  icon: Component
  tone: 'primary' | 'secondary' | 'accent'
}

interface VisibleRequirement extends RequirementPresentation {
  progress: NumericRequirementProgress
}

const requirementPresentations: RequirementPresentation[] = [
  {
    key: 'runCount',
    label: '跑步次數',
    unit: '次',
    icon: Route,
    tone: 'primary',
  },
  {
    key: 'totalDistance',
    label: '累積距離',
    unit: 'km',
    icon: Route,
    tone: 'secondary',
  },
  {
    key: 'distinctLocationCount',
    label: '不同地點類型',
    unit: '種',
    icon: MapPinned,
    tone: 'secondary',
  },
  {
    key: 'badgeCount',
    label: '成就徽章',
    unit: '枚',
    icon: Medal,
    tone: 'accent',
  },
]

const visibleRequirements = computed<VisibleRequirement[]>(() => {
  const requirements = props.progress?.nextLevel?.requirements

  if (!requirements) return []

  return requirementPresentations.flatMap((presentation) => {
    const progress = requirements[presentation.key]

    return progress ? [{ ...presentation, progress }] : []
  })
})

const latestBadge = computed(() => props.progress?.badges.at(-1) ?? null)

const calculatePercentage = ({ current, required }: NumericRequirementProgress) => {
  if (required <= 0) return 0

  return Math.min(Math.round((current / required) * 100), 100)
}

const formatValue = (value: number, key: VisibleRequirement['key']) => {
  return value.toLocaleString('zh-TW', {
    maximumFractionDigits: key === 'totalDistance' ? 2 : 0,
  })
}
</script>

<template>
  <section class="journey-overview" aria-labelledby="journey-overview-title">
    <div v-if="loading" class="journey-overview__loading" aria-label="玩家成長資訊載入中">
      <Skeleton width="8rem" height="1rem" />
      <Skeleton width="14rem" height="2.5rem" />
      <div class="journey-overview__loading-grid">
        <Skeleton v-for="index in 3" :key="index" height="7rem" border-radius="var(--radius-lg)" />
      </div>
    </div>

    <div v-else-if="error" class="journey-overview__error">
      <Message severity="error" :closable="false">{{ error }}</Message>
      <Button label="重新載入" severity="secondary" outlined @click="emit('retry')" />
    </div>

    <template v-else-if="progress">
      <header class="journey-overview__header">
        <div>
          <p class="journey-overview__eyebrow">MY JOURNEY</p>
          <h2 id="journey-overview-title">我的旅程</h2>
          <p>看看現在走到哪裡，以及下一步要完成什麼。</p>
        </div>

        <RouterLink :to="{ name: 'station' }" class="journey-overview__link">
          查看我的足跡
          <ArrowRight :size="18" aria-hidden="true" />
        </RouterLink>
      </header>

      <div class="journey-route" :class="{ 'journey-route--complete': !progress.nextLevel }">
        <article class="journey-route__level journey-route__level--current">
          <span class="journey-route__marker" aria-hidden="true">
            <Route :size="22" />
          </span>
          <div>
            <span>現在的我</span>
            <strong>Lv.{{ progress.currentLevel.level }} {{ progress.currentLevel.name }}</strong>
          </div>
        </article>

        <span v-if="progress.nextLevel" class="journey-route__trail" aria-hidden="true" />

        <article v-if="progress.nextLevel" class="journey-route__level">
          <span class="journey-route__marker" aria-hidden="true">
            <Sparkles :size="22" />
          </span>
          <div>
            <span>下一階段</span>
            <strong>Lv.{{ progress.nextLevel.level }} {{ progress.nextLevel.name }}</strong>
          </div>
        </article>

        <article v-else class="journey-route__completion">
          <Sparkles :size="24" aria-hidden="true" />
          <p>你已完成屬於自己的跑者旅程。</p>
        </article>
      </div>

      <div v-if="visibleRequirements.length" class="journey-requirements">
        <article
          v-for="requirement in visibleRequirements"
          :key="requirement.key"
          class="journey-requirement"
          :class="`journey-requirement--${requirement.tone}`"
        >
          <div class="journey-requirement__heading">
            <span class="journey-requirement__icon" aria-hidden="true">
              <component :is="requirement.icon" :size="20" />
            </span>

            <div>
              <h3>{{ requirement.label }}</h3>
              <span v-if="requirement.progress.isMet" class="journey-requirement__complete">
                <Check :size="15" aria-hidden="true" />
                已完成
              </span>
              <span v-else>繼續累積</span>
            </div>

            <p>
              <strong>{{ formatValue(requirement.progress.current, requirement.key) }}</strong>
              / {{ formatValue(requirement.progress.required, requirement.key) }}
              {{ requirement.unit }}
            </p>
          </div>

          <ProgressBar
            :value="calculatePercentage(requirement.progress)"
            :show-value="false"
            class="journey-requirement__progress"
            :aria-label="`${requirement.label}進度`"
          />
        </article>
      </div>

      <div
        v-if="progress.currentLevel.level === 4"
        class="journey-invitation-status"
        :class="{ 'journey-invitation-status--eligible': progress.pheidiMissionEligible }"
      >
        <Sparkles :size="20" aria-hidden="true" />
        <p v-if="progress.pheidiMissionEligible">已符合菲迪限定任務解鎖資格。</p>
        <p v-else>達成 50 次跑步與 250 km 後，將解鎖「菲迪的邀請函」。</p>
      </div>

      <aside v-if="latestBadge" class="journey-latest-badge">
        <span class="journey-latest-badge__icon" aria-hidden="true">
          <Medal :size="22" />
        </span>
        <div>
          <span>最近取得</span>
          <strong>{{ latestBadge.name }}</strong>
        </div>
        <time :datetime="latestBadge.unlockedAt">
          {{ formatNumericDate(latestBadge.unlockedAt, 'Asia/Taipei') }}
        </time>
      </aside>
    </template>
  </section>
</template>

<style scoped>
.journey-overview {
  width: 100%;
  min-height: 420px;
  margin-top: var(--space-6);
  padding: var(--space-6);
  overflow: hidden;

  background:
    radial-gradient(
      circle at 92% 8%,
      color-mix(in srgb, var(--color-primary) 16%, transparent),
      transparent 30%
    ),
    var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.journey-overview__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
}

.journey-overview__eyebrow {
  margin: 0 0 var(--space-2);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
}

.journey-overview__header h2 {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-heading);
}

.journey-overview__header p {
  margin: var(--space-2) 0 0;

  color: var(--color-text-secondary);
}

.journey-overview__link {
  display: inline-flex;
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  text-decoration: none;

  background: var(--color-primary-pale);
  border-radius: var(--radius-full);

  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.journey-overview__link:hover {
  color: var(--color-accent);
  transform: translateY(-2px);
}

.journey-overview__link:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 3px;
}

.journey-route {
  display: grid;
  margin-top: var(--space-6);
  grid-template-columns: minmax(0, 1fr) minmax(80px, 0.36fr) minmax(0, 1fr);
  align-items: center;
}

.journey-route--complete {
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-5);
}

.journey-route__level {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.journey-route__marker {
  display: grid;
  width: 52px;
  aspect-ratio: 1;
  flex: 0 0 auto;
  place-items: center;

  color: var(--color-accent);

  background: var(--color-accent-pale);
  border: 2px solid var(--color-accent-soft);
  border-radius: 50%;
}

.journey-route__level--current .journey-route__marker {
  color: var(--color-primary);

  background: var(--color-primary-pale);
  border-color: var(--color-primary-soft);
}

.journey-route__level div {
  display: grid;
  gap: var(--space-1);
}

.journey-route__level span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.journey-route__level strong {
  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.journey-route__trail {
  height: 2px;
  margin-inline: var(--space-3);

  background-image: linear-gradient(to right, var(--color-primary) 50%, transparent 50%);
  background-size: 12px 2px;
}

.journey-route__completion {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  color: var(--color-accent);
}

.journey-route__completion p {
  margin: 0;

  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.journey-requirements {
  display: grid;
  margin-top: var(--space-6);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.journey-requirement {
  --requirement-color: var(--color-primary);
  --requirement-background: var(--color-primary-pale);

  min-width: 0;
  padding: var(--space-4);

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.journey-requirement--secondary {
  --requirement-color: var(--color-secondary);
  --requirement-background: var(--color-secondary-pale);
}

.journey-requirement--accent {
  --requirement-color: var(--color-accent);
  --requirement-background: var(--color-accent-pale);
}

.journey-requirement__heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
}

.journey-requirement__icon {
  display: grid;
  width: 40px;
  aspect-ratio: 1;
  place-items: center;

  color: var(--requirement-color);

  background: var(--requirement-background);
  border-radius: var(--radius-md);
}

.journey-requirement h3 {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-heading);
}

.journey-requirement__heading div > span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.journey-requirement__complete {
  color: var(--color-success) !important;
  font-weight: var(--font-weight-medium);
}

.journey-requirement__heading p {
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.journey-requirement__heading strong {
  color: var(--color-text);
  font-size: var(--font-size-base);
}

.journey-requirement__progress {
  height: 8px;
  margin-top: var(--space-3);
  overflow: hidden;

  background: var(--color-border);
  border-radius: var(--radius-full);
}

.journey-requirement__progress :deep(.p-progressbar-value) {
  background: var(--requirement-color);
  border-radius: var(--radius-full);
}

.journey-invitation-status,
.journey-latest-badge {
  display: flex;
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  align-items: center;
  gap: var(--space-3);

  color: var(--color-text-secondary);

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.journey-invitation-status--eligible {
  color: var(--color-text);

  background: var(--color-accent-pale);
  border-color: var(--color-accent-soft);
}

.journey-invitation-status p {
  margin: 0;
}

.journey-latest-badge__icon {
  display: grid;
  width: 40px;
  aspect-ratio: 1;
  place-items: center;

  color: var(--color-accent);

  background: var(--color-accent-pale);
  border-radius: 50%;
}

.journey-latest-badge div {
  display: grid;
  gap: var(--space-1);
}

.journey-latest-badge div span,
.journey-latest-badge time {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.journey-latest-badge strong {
  color: var(--color-text);
}

.journey-latest-badge time {
  margin-left: auto;
}

.journey-overview__loading,
.journey-overview__error {
  display: flex;
  min-height: 356px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-4);
}

.journey-overview__loading-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .journey-overview__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .journey-requirements {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .journey-overview {
    min-height: 520px;
    margin-top: var(--space-4);
    padding: var(--space-4);

    border-radius: var(--radius-lg);
  }

  .journey-overview__header h2 {
    font-size: var(--font-size-md);
  }

  .journey-overview__link {
    width: 100%;
  }

  .journey-route,
  .journey-route--complete {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .journey-route__trail {
    width: 2px;
    height: 32px;
    margin-left: 25px;

    background-image: linear-gradient(to bottom, var(--color-primary) 50%, transparent 50%);
    background-size: 2px 12px;
  }

  .journey-route__level strong {
    font-size: var(--font-size-base);
  }

  .journey-requirement__heading {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .journey-requirement__heading p {
    grid-column: 2;
  }

  .journey-latest-badge {
    align-items: flex-start;
  }

  .journey-latest-badge time {
    margin-left: 0;
  }

  .journey-overview__loading-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .journey-overview__link,
  .journey-requirement__progress :deep(.p-progressbar-value) {
    transition: none;
  }
}
</style>
