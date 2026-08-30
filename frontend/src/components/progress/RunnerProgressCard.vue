<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Check, MapPinned, Medal, Route, Sparkles } from '@lucide/vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'

import BaseCard from '@/components/base/BaseCard.vue'
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

const joinRequirementPhrases = (phrases: string[]) => {
  if (phrases.length <= 1) return phrases[0] ?? ''

  return `${phrases.slice(0, -1).join('、')}與${phrases.at(-1)}`
}

const remainingProgressMessage = computed(() => {
  if (!props.progress?.nextLevel) return ''

  if (props.progress.currentLevel.level === 4 && props.progress.pheidiMissionEligible) {
    return '你已符合菲迪限定任務解鎖資格。'
  }

  const remainingPhrases = visibleRequirements.value.flatMap((requirement) => {
    if (requirement.progress.isMet) return []

    const rawRemaining = Math.max(requirement.progress.required - requirement.progress.current, 0)
    const remaining =
      requirement.key === 'totalDistance'
        ? Math.round(rawRemaining * 100) / 100
        : Math.ceil(rawRemaining)

    if (requirement.key === 'runCount') return [`${formatValue(remaining, requirement.key)} 次跑步`]
    if (requirement.key === 'totalDistance')
      return [`${formatValue(remaining, requirement.key)} km`]
    if (requirement.key === 'distinctLocationCount') {
      return [`${formatValue(remaining, requirement.key)} 種地點`]
    }

    return [`${formatValue(remaining, requirement.key)} 枚徽章`]
  })

  if (!remainingPhrases.length) return ''

  const destination =
    props.progress.currentLevel.level === 4
      ? '就能收到菲迪的邀請函。'
      : `就能成為「${props.progress.nextLevel.name}」。`

  return `再完成 ${joinRequirementPhrases(remainingPhrases)}，${destination}`
})

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
  <BaseCard as="section" class="journey-overview" aria-labelledby="journey-overview-title">
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
          :class="[
            `journey-requirement--${requirement.tone}`,
            { 'journey-requirement--complete': requirement.progress.isMet },
          ]"
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
        v-if="remainingProgressMessage"
        class="journey-next-step"
        :class="{ 'journey-next-step--eligible': progress.pheidiMissionEligible }"
      >
        <Sparkles :size="20" aria-hidden="true" />
        <p>{{ remainingProgressMessage }}</p>
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
  </BaseCard>
</template>

<style scoped>
.journey-overview {
  width: 100%;
  margin-top: var(--space-6);
  padding: var(--space-5) var(--space-6);
  overflow: hidden;

  border-radius: var(--radius-xl);
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
  margin-top: var(--space-5);
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
  margin-top: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));

  background: color-mix(in srgb, var(--color-background) 76%, var(--color-surface));
  border-block: 1px solid var(--color-border);
}

.journey-requirement {
  --requirement-color: var(--color-primary);
  --requirement-background: var(--color-primary-pale);

  min-width: 0;
  padding: var(--space-3) var(--space-4);

  border-right: 1px solid var(--color-border);
}

.journey-requirement:last-child {
  border-right: 0;
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
  width: 36px;
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
  color: var(--color-text-secondary) !important;
}

.journey-requirement--complete {
  --requirement-color: var(--color-text-secondary);
  --requirement-background: var(--color-surface);

  opacity: 0.72;
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
  height: 6px;
  margin-top: var(--space-2);
  overflow: hidden;

  background: var(--color-border);
  border-radius: var(--radius-full);
}

.journey-requirement__progress :deep(.p-progressbar-value) {
  background: var(--requirement-color);
  border-radius: var(--radius-full);
}

.journey-next-step,
.journey-latest-badge {
  display: flex;
  margin-top: var(--space-3);
  align-items: center;
  gap: var(--space-3);

  color: var(--color-text-secondary);
}

.journey-next-step {
  padding: var(--space-2) var(--space-3);

  background: var(--color-primary-pale);
  border-radius: var(--radius-md);
}

.journey-next-step--eligible {
  color: var(--color-text);

  background: var(--color-accent-pale);
}

.journey-next-step p {
  margin: 0;

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.journey-latest-badge {
  padding: var(--space-3) 0 0;

  border-top: 1px dashed var(--color-border);
}

.journey-latest-badge__icon {
  display: grid;
  width: 32px;
  aspect-ratio: 1;
  place-items: center;

  color: var(--color-accent);

  background: var(--color-background);
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .journey-requirement:nth-child(even) {
    border-right: 0;
  }
}

@media (max-width: 600px) {
  .journey-overview {
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

  .journey-requirements {
    grid-template-columns: 1fr;
  }

  .journey-requirement,
  .journey-requirement:nth-child(even) {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .journey-requirement:last-child {
    border-bottom: 0;
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
