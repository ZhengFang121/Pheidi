<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  Check,
  CircleMinus,
  Footprints,
  MapPinned,
  Medal,
  Route,
  Sparkles,
  UserRound,
} from '@lucide/vue'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import type {
  NumericRequirementProgress,
  RunnerLevelRequirements,
  RunnerProgress,
} from '@/types/runnerProgress'

const props = defineProps<{
  progress: RunnerProgress | null
  username: string
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  retry: []
}>()

interface RequirementPresentation {
  key: keyof RunnerLevelRequirements
  label: string
  unit: string
  icon: Component
  tone: 'primary' | 'secondary' | 'accent'
}

interface VisibleRequirement extends RequirementPresentation {
  progress: NumericRequirementProgress
}

const router = useRouter()
const avatarLoadFailed = ref(false)
const runnerAvatarUrl = '/images/profile%20photo/runner.png'

const requirementPresentations: RequirementPresentation[] = [
  { key: 'runCount', label: '跑步次數', unit: '次', icon: Footprints, tone: 'primary' },
  { key: 'totalDistance', label: '累積距離', unit: 'km', icon: Route, tone: 'secondary' },
  {
    key: 'distinctLocationCount',
    label: '不同地點類型',
    unit: '種',
    icon: MapPinned,
    tone: 'secondary',
  },
  { key: 'badgeCount', label: '徽章數量', unit: '枚', icon: Medal, tone: 'accent' },
  {
    key: 'pheidiMission',
    label: '菲迪限定任務',
    unit: '個',
    icon: Sparkles,
    tone: 'accent',
  },
]

const displayName = computed(() => props.username.trim() || '跑者')

const currentLevelLabel = computed(() => {
  if (!props.progress) return '旅程資料暫時無法取得'

  return `Lv.${props.progress.currentLevel.level} ${props.progress.currentLevel.name}`
})

const visibleRequirements = computed<VisibleRequirement[]>(() => {
  const requirements = props.progress?.nextLevel?.requirements

  if (!requirements) return []

  return requirementPresentations.flatMap((presentation) => {
    const requirementProgress = requirements[presentation.key]

    return requirementProgress ? [{ ...presentation, progress: requirementProgress }] : []
  })
})

const hasNoSpecialCondition = computed(() => props.progress?.currentLevel.level === 1)

const safeNumber = (value: number) => (Number.isFinite(value) ? Math.max(value, 0) : 0)

const calculatePercentage = ({ current, required }: NumericRequirementProgress) => {
  const safeCurrent = safeNumber(current)
  const safeRequired = safeNumber(required)

  if (safeRequired <= 0) return 0

  return Math.min(Math.round((safeCurrent / safeRequired) * 100), 100)
}

function formatValue(value: number, key: keyof RunnerLevelRequirements) {
  return safeNumber(value).toLocaleString('zh-TW', {
    maximumFractionDigits: key === 'totalDistance' ? 2 : 0,
  })
}

const completionStats = computed(() => {
  const stats = props.progress?.stats

  return [
    { label: '累積跑步', value: formatValue(stats?.runCount ?? 0, 'runCount'), unit: '次' },
    {
      label: '累積距離',
      value: formatValue(stats?.totalDistance ?? 0, 'totalDistance'),
      unit: 'km',
    },
  ]
})

const openStation = () => router.push({ name: 'station' })
</script>

<template>
  <section class="journey-overview" aria-label="我的旅程">
    <BaseCard as="article" class="journey-card journey-player-card">
      <div v-if="loading" class="journey-player-card__loading" aria-label="玩家資訊載入中">
        <Skeleton width="8rem" height="2rem" />
        <Skeleton shape="circle" size="9rem" />
        <Skeleton width="10rem" height="1.75rem" />
        <Skeleton width="8rem" height="2.25rem" border-radius="var(--radius-full)" />
      </div>

      <div v-else class="journey-player-card__content">
        <header class="journey-player-card__heading">
          <p>Beginner runner</p>
          <h2 id="journey-overview-title">新手跑者</h2>
        </header>

        <div class="journey-player-card__panel">
          <div class="journey-player-card__avatar">
            <img
              v-if="!avatarLoadFailed"
              :src="runnerAvatarUrl"
              :alt="`${displayName}的跑者頭像`"
              @error="avatarLoadFailed = true"
            />
            <UserRound
              v-else
              :size="72"
              role="img"
              :aria-label="`${displayName}的預設跑者頭像`"
            />
          </div>

          <div class="journey-player-card__details">
            <p class="journey-player-card__name">{{ displayName }}</p>
            <Tag :value="currentLevelLabel" rounded class="journey-player-card__level" />
          </div>
        </div>
      </div>
    </BaseCard>

    <BaseCard as="article" class="journey-card journey-progress-card">
      <div v-if="loading" class="journey-progress-card__loading" aria-label="下一階段進度載入中">
        <div class="journey-progress-card__loading-heading">
          <Skeleton width="10rem" height="2rem" />
          <Skeleton width="8rem" height="2rem" border-radius="var(--radius-full)" />
        </div>
        <Skeleton v-for="index in 3" :key="index" height="6.5rem" border-radius="var(--radius-lg)" />
      </div>

      <div v-else-if="error" class="journey-progress-card__error">
        <Message severity="error" :closable="false">{{ error }}</Message>
        <BaseButton label="重新載入" variant="secondary" @click="emit('retry')" />
      </div>

      <template v-else-if="progress">
        <header class="journey-progress-card__header">
          <h2 id="journey-progress-title">
            {{ progress.nextLevel ? '邁向下一階段' : '已完成所有階段' }}
          </h2>
          <Tag
            :value="
              progress.nextLevel
                ? `Lv.${progress.nextLevel.level} ${progress.nextLevel.name}`
                : `Lv.${progress.currentLevel.level} ${progress.currentLevel.name}`
            "
            rounded
            class="journey-progress-card__level"
          />
        </header>

        <template v-if="progress.nextLevel">
          <div class="journey-requirements">
            <article
              v-for="requirement in visibleRequirements"
              :key="requirement.key"
              class="journey-requirement"
              :class="[
                `journey-requirement--${requirement.tone}`,
                { 'journey-requirement--complete': requirement.progress.isMet },
              ]"
            >
              <span class="journey-requirement__icon" aria-hidden="true">
                <component :is="requirement.icon" :size="21" />
              </span>

              <div class="journey-requirement__content">
                <div class="journey-requirement__heading">
                  <div>
                    <h3>{{ requirement.label }}</h3>
                    <span v-if="requirement.progress.isMet" class="journey-requirement__status">
                      <Check :size="15" aria-hidden="true" />
                      已完成
                    </span>
                    <span v-else class="journey-requirement__status">繼續累積</span>
                  </div>

                  <p class="journey-requirement__value">
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
                  :aria-valuetext="`${formatValue(requirement.progress.current, requirement.key)} / ${formatValue(requirement.progress.required, requirement.key)} ${requirement.unit}`"
                />
              </div>
            </article>

            <article v-if="hasNoSpecialCondition" class="journey-requirement journey-requirement--static">
              <span class="journey-requirement__icon" aria-hidden="true">
                <CircleMinus :size="21" />
              </span>
              <div class="journey-requirement__content journey-requirement__content--static">
                <h3>特殊條件</h3>
                <p>無</p>
              </div>
            </article>
          </div>
        </template>

        <div v-else class="journey-completion">
          <div class="journey-completion__message">
            <Sparkles :size="24" aria-hidden="true" />
            <p>你已完成菲迪的旅程，繼續累積屬於自己的跑步足跡吧！</p>
          </div>

          <dl class="journey-completion__stats">
            <div v-for="stat in completionStats" :key="stat.label">
              <dt>{{ stat.label }}</dt>
              <dd>{{ stat.value }} {{ stat.unit }}</dd>
            </div>
          </dl>
        </div>

        <footer class="journey-progress-card__footer">
          <BaseButton
            label="查看我的足跡"
            variant="primary"
            class="journey-progress-card__cta"
            @click="openStation"
          />
        </footer>
      </template>
    </BaseCard>
  </section>
</template>

<style scoped>
.journey-overview {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 2fr);
  align-items: stretch;
  gap: var(--space-5);
}

.journey-card {
  min-width: 0;
  padding: var(--space-5) var(--space-6);
  overflow: hidden;
  border-radius: var(--radius-xl);
}

.journey-player-card__content,
.journey-player-card__loading {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.journey-player-card__content {
  --journey-avatar-size: clamp(148px, 14vw, 192px);

  justify-content: flex-start;
}

.journey-player-card__loading {
  gap: var(--space-4);
}

.journey-progress-card__header h2 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.journey-player-card__heading {
  display: grid;
  gap: var(--space-1);
}

.journey-player-card__heading p,
.journey-player-card__heading h2 {
  margin: 0;
}

.journey-player-card__heading p {
  color: var(--color-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-base);
}

.journey-player-card__heading h2 {
  color: var(--color-secondary);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.journey-player-card__panel {
  position: relative;
  display: flex;
  width: 100%;
  margin-top: calc(var(--journey-avatar-size) / 2 + var(--space-5));
  padding: calc(var(--journey-avatar-size) / 2 + var(--space-5)) var(--space-4) var(--space-5);
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  border-radius: var(--radius-lg);
}

.journey-player-card__details {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  transform: translateY(calc(var(--space-4) * -1));
}

.journey-player-card__avatar {
  position: absolute;
  top: 0;
  left: 50%;
  display: grid;
  width: var(--journey-avatar-size);
  max-width: 78%;
  aspect-ratio: 1;
  overflow: hidden;
  place-items: center;
  color: var(--color-secondary);
  background: var(--color-surface);
  border: 4px solid var(--color-secondary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.journey-player-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: translateY(-3%) scale(1.85);
  transform-origin: center;
}

.journey-player-card__name {
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-secondary-pale);
  font-size: clamp(var(--font-size-md), 2.2vw, var(--font-size-lg));
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
  line-height: var(--line-height-heading);
  text-transform: uppercase;
}

.journey-player-card__level.p-tag,
.journey-progress-card__level.p-tag {
  padding: var(--space-2) var(--space-4);
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  background: color-mix(in srgb, var(--color-surface) 68%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-secondary) 44%, transparent);
  border-radius: var(--radius-full);
}

.journey-player-card__level.p-tag {
  margin-top: var(--space-4);
  width: 72%;
  justify-content: center;
  background: var(--color-surface);
}

.journey-progress-card {
  display: flex;
  flex-direction: column;
}

.journey-progress-card__header,
.journey-progress-card__loading-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.journey-progress-card__level {
  flex: 0 0 auto;
  background: var(--color-secondary-pale);
}

.journey-progress-card__loading,
.journey-progress-card__error {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-4);
}

.journey-progress-card__loading-heading {
  margin-bottom: var(--space-2);
}

.journey-progress-card__error {
  align-items: flex-start;
}

.journey-requirements {
  display: grid;
  margin-top: var(--space-5);
  gap: var(--space-4);
}

.journey-requirement {
  --requirement-color: var(--color-primary);
  --requirement-background: var(--color-primary-pale);
  display: grid;
  min-width: 0;
  padding: var(--space-4);
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-4);
  background: color-mix(in srgb, var(--color-surface) 66%, transparent);
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

.journey-requirement--complete,
.journey-requirement--static {
  --requirement-color: var(--color-text-secondary);
  --requirement-background: var(--color-background);
}

.journey-requirement__icon {
  display: grid;
  width: 42px;
  aspect-ratio: 1;
  place-items: center;
  color: var(--requirement-color);
  background: var(--requirement-background);
  border-radius: var(--radius-md);
}

.journey-requirement__content {
  min-width: 0;
}

.journey-requirement__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.journey-requirement h3 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-heading);
}

.journey-requirement__status {
  display: inline-flex;
  margin-top: var(--space-1);
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.journey-requirement__value {
  flex: 0 0 auto;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.journey-requirement__value strong {
  color: var(--color-text);
  font-size: var(--font-size-base);
}

.journey-requirement__progress {
  height: 7px;
  margin-top: var(--space-3);
  overflow: hidden;
  background: var(--color-border);
  border-radius: var(--radius-full);
}

.journey-requirement__progress :deep(.p-progressbar-value) {
  background: var(--requirement-color);
  border-radius: var(--radius-full);
}

.journey-requirement__content--static {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.journey-requirement__content--static p {
  margin: 0;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.journey-completion {
  display: grid;
  margin-top: var(--space-5);
  gap: var(--space-5);
}

.journey-completion__message {
  display: flex;
  padding: var(--space-4);
  align-items: flex-start;
  gap: var(--space-3);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent-pale) 72%, transparent);
  border-radius: var(--radius-lg);
}

.journey-completion__message p {
  margin: 0;
  color: var(--color-text);
}

.journey-completion__stats {
  display: grid;
  margin: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.journey-completion__stats div {
  padding-block: var(--space-3);
  border-block: 1px solid var(--color-border);
}

.journey-completion__stats dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.journey-completion__stats dd {
  margin: var(--space-1) 0 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.journey-progress-card__footer {
  display: flex;
  margin-top: auto;
  padding-top: var(--space-5);
  justify-content: flex-end;
}

.journey-progress-card__footer :deep(.journey-progress-card__cta.base-button) {
  min-height: 44px;
  border-radius: var(--radius-full);
}

@media (max-width: 900px) {
  .journey-overview {
    grid-template-columns: 1fr;
  }

  .journey-player-card__avatar {
    max-width: 72%;
  }
}

@media (max-width: 600px) {
  .journey-overview {
    gap: var(--space-4);
  }

  .journey-card {
    padding: var(--space-4);
    border-radius: var(--radius-lg);
  }

  .journey-player-card__content {
    --journey-avatar-size: clamp(148px, 42vw, 184px);
  }

  .journey-progress-card__header,
  .journey-progress-card__loading-heading,
  .journey-requirement__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .journey-requirement {
    padding: var(--space-3);
    align-items: start;
    gap: var(--space-3);
  }

  .journey-requirement__value {
    white-space: normal;
  }

  .journey-completion__stats {
    grid-template-columns: 1fr;
  }

  .journey-progress-card__footer :deep(.base-button) {
    width: 100%;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .journey-requirement__progress :deep(.p-progressbar-value) {
    transition: none;
  }
}
</style>
