<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { Medal, Route, Trophy } from '@lucide/vue'

interface PlayerBadge {
  id: number
  name: string
  color: string
}

interface PlayerData {
  name: string
  level: number
  levelName: string
  avatarUrl?: string
  runCount: number
  nextLevelRunCount: number
  distance: number
  nextLevelDistance: number
  collectedBadgeCount: number
  badges: PlayerBadge[]
}

const player: PlayerData = {
  name: '黃小芳',
  level: 2,
  levelName: '習跑者',
  avatarUrl: '',
  runCount: 7,
  nextLevelRunCount: 10,
  distance: 18,
  nextLevelDistance: 30,
  collectedBadgeCount: 12,
  badges: [
    {
      id: 1,
      name: '初次啟程',
      color: 'var(--color-primary)',
    },
    {
      id: 2,
      name: '晨光跑者',
      color: 'var(--color-secondary)',
    },
    {
      id: 3,
      name: '三公里達成',
      color: 'var(--color-accent)',
    },
  ],
}

const calculateProgress = (current: number, target: number): number => {
  if (target <= 0) {
    return 0
  }

  return Math.min(Math.round((current / target) * 100), 100)
}

const runCountProgress = calculateProgress(
  player.runCount,
  player.nextLevelRunCount,
)

const distanceProgress = calculateProgress(
  player.distance,
  player.nextLevelDistance,
)

const remainingRunCount = Math.max(
  player.nextLevelRunCount - player.runCount,
  0,
)

const remainingDistance = Math.max(
  player.nextLevelDistance - player.distance,
  0,
)
</script>

<template>
  <section
    class="player-overview"
    aria-labelledby="player-overview-title"
  >
    <h2
      id="player-overview-title"
      class="sr-only"
    >
      玩家資訊與累積數據
    </h2>

    <!-- 左側：玩家卡片 -->
    <Card class="overview-card player-card base-card base-card--glass">
      <template #content>
        <div class="player-card__content">
          <Avatar
            v-if="player.avatarUrl"
            :image="player.avatarUrl"
            shape="circle"
            class="player-avatar"
            :aria-label="`${player.name}的玩家頭像`"
          />

          <Avatar
            v-else
            icon="pi pi-user"
            shape="circle"
            class="player-avatar"
            aria-label="預設玩家頭像"
          />

          <div class="player-info">
            <p class="player-info__eyebrow">
              RUNNER PROFILE
            </p>

            <h3 class="player-info__name">
              {{ player.name }}
            </h3>

            <Tag
              :value="`Lv. ${player.level} ${player.levelName}`"
              rounded
              class="player-level"
            />
          </div>

          <div class="recent-badges">
            <p class="recent-badges__title">
              最近獲得
            </p>

            <div class="recent-badges__list">
              <div
                v-for="badge in player.badges"
                :key="badge.id"
                class="achievement-badge"
                :style="{ '--badge-color': badge.color }"
              >
                <Medal
                  :size="24"
                  :stroke-width="1.8"
                  aria-hidden="true"
                />

                <span class="sr-only">
                  {{ badge.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- 右側：累積數據 -->
    <Card class="overview-card stats-card base-card base-card--glass">
      <template #content>
        <div class="stats-card__content">
          <div class="stats-heading">
            <div>
              <p class="stats-heading__eyebrow">
                RUNNER PROGRESS
              </p>

              <h3 class="stats-heading__title">
                累積數據
              </h3>
            </div>

            <p class="stats-heading__level">
              下一階段：冒險者
            </p>
          </div>

          <div class="stats-list">
            <!-- 跑步次數 -->
            <article class="stat-item">
              <div class="stat-item__icon stat-item__icon--primary">
                <Route
                  :size="24"
                  :stroke-width="1.8"
                  aria-hidden="true"
                />
              </div>

              <div class="stat-item__main">
                <div class="stat-item__header">
                  <div>
                    <h4 class="stat-item__title">
                      跑步次數
                    </h4>

                    <p class="stat-item__description">
                      再跑 {{ remainingRunCount }} 次即可達成升等條件
                    </p>
                  </div>

                  <p class="stat-item__value">
                    <strong>{{ player.runCount }}</strong>
                    <span>/ {{ player.nextLevelRunCount }} 次</span>
                  </p>
                </div>

                <ProgressBar
                  :value="runCountProgress"
                  :show-value="false"
                  class="runner-progress runner-progress--primary"
                  aria-label="跑步次數升等進度"
                />
              </div>
            </article>

            <!-- 累積距離 -->
            <article class="stat-item">
              <div class="stat-item__icon stat-item__icon--secondary">
                <Route
                  :size="24"
                  :stroke-width="1.8"
                  aria-hidden="true"
                />
              </div>

              <div class="stat-item__main">
                <div class="stat-item__header">
                  <div>
                    <h4 class="stat-item__title">
                      累積距離
                    </h4>

                    <p class="stat-item__description">
                      距離升等目標還差 {{ remainingDistance }} km
                    </p>
                  </div>

                  <p class="stat-item__value">
                    <strong>{{ player.distance }}</strong>
                    <span>/ {{ player.nextLevelDistance }} km</span>
                  </p>
                </div>

                <ProgressBar
                  :value="distanceProgress"
                  :show-value="false"
                  class="runner-progress runner-progress--secondary"
                  aria-label="累積距離升等進度"
                />
              </div>
            </article>

            <!-- 收集徽章 -->
            <article class="stat-item stat-item--badge">
              <div class="stat-item__icon stat-item__icon--accent">
                <Trophy
                  :size="24"
                  :stroke-width="1.8"
                  aria-hidden="true"
                />
              </div>

              <div class="stat-item__main">
                <div class="stat-item__header">
                  <div>
                    <h4 class="stat-item__title">
                      成就徽章
                    </h4>

                    <p class="stat-item__description">
                      每一枚徽章，都是旅程留下的足跡
                    </p>
                  </div>

                  <p class="stat-item__value">
                    <strong>{{ player.collectedBadgeCount }}</strong>
                    <span>枚</span>
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<style scoped>
.player-overview {
  display: grid;
  grid-template-columns: minmax(240px, 0.75fr) minmax(0, 2fr);
  gap: var(--space-3, 24px);
  width: 100%;
  margin-top: var(--space-3, 24px);
}

.overview-card {
  overflow: hidden;
  border-radius: 24px;
}

.overview-card :deep(.p-card-body),
.overview-card :deep(.p-card-content) {
  height: 100%;
  padding: 0;
}

/* 玩家卡片 */

.player-card__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 340px;
  padding: var(--space-4, 32px);
  text-align: center;
}

.player-avatar {
  width: 112px;
  height: 112px;
  margin-bottom: var(--space-3, 24px);
  border: 6px solid var(--color-primary-pale, #d4f9f4);
  background: var(--color-primary-soft, #b4ebe6);
  color: var(--color-dark, #3c435e);
  font-size: 2.5rem;
  box-shadow: 0 10px 24px rgb(60 67 94 / 10%);
}

.player-avatar :deep(img) {
  object-fit: cover;
}

.player-info__eyebrow,
.stats-heading__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: var(--font-weight-b, 700);
  letter-spacing: 0.16em;
}

.player-info__name {
  margin: 0 0 12px;
  color: var(--color-text, #3c435e);
  font-size: 1.5rem;
  line-height: 1.4;
}

.player-level {
  background: var(--color-primary-pale, #d4f9f4);
  color: var(--color-dark, #3c435e);
  font-weight: var(--font-weight-b, 700);
}

.recent-badges {
  width: 100%;
  margin-top: auto;
  padding-top: var(--space-4, 32px);
}

.recent-badges__title {
  margin: 0 0 12px;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
}

.recent-badges__list {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.achievement-badge {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 2px solid
    color-mix(in srgb, var(--badge-color) 36%, transparent);
  border-radius: 50%;
  background:
    color-mix(in srgb, var(--badge-color) 16%, white);
  color: var(--badge-color);
}

/* 累積數據 */

.stats-card__content {
  min-height: 340px;
  padding: var(--space-4, 32px);
}

.stats-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--space-3, 24px);
}

.stats-heading__title {
  margin: 0;
  color: var(--color-text, #3c435e);
  font-size: 1.5rem;
  line-height: 1.4;
}

.stats-heading__level {
  margin: 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
}

.stats-list {
  display: grid;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 18px 20px;
  border-radius: 18px;
  background: #f8fbfb;
}

.stat-item__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
}

.stat-item__icon--primary {
  background: var(--color-primary-pale, #d4f9f4);
  color: var(--color-primary, #5bd0d4);
}

.stat-item__icon--secondary {
  background: var(--color-secondary-pale, #ebf4e1);
  color: var(--color-secondary, #b3ce89);
}

.stat-item__icon--accent {
  background: var(--color-accent-pale, #fff6de);
  color: var(--color-accent, #ff9c46);
}

.stat-item__main {
  flex: 1;
  min-width: 0;
}

.stat-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 12px;
}

.stat-item--badge .stat-item__header {
  align-items: center;
  margin-bottom: 0;
}

.stat-item__title {
  margin: 0 0 4px;
  color: var(--color-text, #3c435e);
  font-size: 1rem;
  line-height: 1.5;
}

.stat-item__description {
  margin: 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.8rem;
  line-height: 1.6;
}

.stat-item__value {
  flex: 0 0 auto;
  margin: 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
  white-space: nowrap;
}

.stat-item__value strong {
  margin-right: 4px;
  color: var(--color-text, #3c435e);
  font-size: 1.35rem;
}

.runner-progress {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8eeee;
}

.runner-progress :deep(.p-progressbar-value) {
  border-radius: 999px;
  transition: none;
}

.runner-progress--primary :deep(.p-progressbar-value) {
  background: var(--color-primary, #5bd0d4);
}

.runner-progress--secondary :deep(.p-progressbar-value) {
  background: var(--color-secondary, #b3ce89);
}

/* 螢幕閱讀器專用文字 */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 平板與手機 */

@media (max-width: 900px) {
  .player-overview {
    grid-template-columns: 1fr;
  }

  .player-card__content {
    min-height: auto;
  }

  .recent-badges {
    margin-top: 0;
  }
}

@media (max-width: 560px) {
  .player-overview {
    gap: var(--space-2, 16px);
    margin-top: var(--space-2, 16px);
  }

  .player-card__content,
  .stats-card__content {
    padding: var(--space-3, 24px);
  }

  .stats-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .stat-item {
    align-items: flex-start;
    padding: 16px;
  }

  .stat-item__header {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item__value {
    order: -1;
  }
}
</style>
