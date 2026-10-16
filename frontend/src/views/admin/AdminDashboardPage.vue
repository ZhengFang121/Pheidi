<template>
  <section class="dashboard-page">
    <div class="dashboard-heading">
      <div>
        <p class="dashboard-eyebrow">HOME</p>
        <h2 class="dashboard-title">首頁</h2>
        <p class="dashboard-description">掌握玩家、文章與廣場三個管理模組的即時概況。</p>
      </div>
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">
      <div class="error-content">
        <span>{{ errorMessage }}</span>

        <BaseButton
          type="button"
          label="重新載入"
          variant="secondary"
          size="small"
          @click="loadDashboard"
        />
      </div>
    </Message>

    <div v-if="isLoading && !statistics" class="management-overview-grid">
      <Skeleton
        v-for="index in 3"
        :key="index"
        width="100%"
        height="12rem"
        border-radius="var(--radius-lg)"
      />
    </div>

    <div v-else-if="statistics" class="management-overview-grid">
      <BaseCard
        v-for="module in managementModules"
        :key="module.route"
        :as="RouterLink"
        :to="module.route"
        :class="['management-card', `management-card--${module.tone}`]"
      >
        <header class="management-card-header">
          <div class="management-card-identity">
            <div class="management-card-icon">
              <component :is="module.icon" aria-hidden="true" />
            </div>
            <div>
              <p class="management-card-eyebrow">{{ module.eyebrow }}</p>
              <h3 class="management-card-title">{{ module.title }}</h3>
            </div>
          </div>

          <ArrowRight class="management-card-arrow" aria-hidden="true" />
        </header>

        <div class="management-card-total">
          <span>{{ module.totalLabel }}</span>
          <strong>{{ module.totalValue.toLocaleString('zh-TW') }}</strong>
        </div>

        <dl class="management-card-details">
          <div v-for="detail in module.details" :key="detail.label">
            <dt>{{ detail.label }}</dt>
            <dd>{{ detail.value.toLocaleString('zh-TW') }}</dd>
          </div>
        </dl>
      </BaseCard>
    </div>

    <div class="trend-toolbar">
      <div class="trend-period-field">
        <label for="dashboard-period" class="form-field__label">統計期間</label>
        <Select
          v-model="selectedPeriod"
          input-id="dashboard-period"
          :options="periodOptions"
          option-label="label"
          option-value="value"
          :loading="isLoading"
          aria-describedby="dashboard-period-status"
        />
      </div>
      <p id="dashboard-period-status" class="trend-period-status" role="status">
        {{ isLoading ? '趨勢資料載入中…' : periodDescription }}
      </p>
    </div>

    <div v-if="isLoading" class="trend-grid" aria-label="趨勢資料載入中" aria-busy="true">
      <Skeleton
        v-for="index in 3"
        :key="index"
        width="100%"
        height="25rem"
        border-radius="var(--radius-lg)"
      />
    </div>

    <div v-else-if="trend" class="trend-grid">
      <AdminTrendCard v-for="card in trendCards" :key="card.title" v-bind="card" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { isAxiosError } from 'axios'
import { ArrowRight, Files, MessageSquareText, UsersRound } from '@lucide/vue'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Select from 'primevue/select'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import AdminTrendCard from '@/components/admin/AdminTrendCard.vue'
import { getAdminDashboard } from '@/services/adminDashboard'
import type {
  AdminDashboardPeriod,
  AdminDashboardPeriodKey,
  AdminDashboardStatistics,
  AdminDashboardTrend,
} from '@/types/user'

interface ManagementModule {
  eyebrow: string
  title: string
  route: string
  totalLabel: string
  totalValue: number
  details: Array<{
    label: string
    value: number
  }>
  tone: 'primary' | 'secondary' | 'accent'
  icon: Component
}

const statistics = ref<AdminDashboardStatistics | null>(null)
const trend = ref<AdminDashboardTrend | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const periodStorageKey = 'pheidi-admin-dashboard-period'
const periodOptions = [
  { label: '最近 30 天', value: 'recent-30-days' },
  { label: '2026 年 9 月', value: '2026-09' },
]
const readSavedPeriod = (): AdminDashboardPeriodKey => {
  try {
    return sessionStorage.getItem(periodStorageKey) === '2026-09' ? '2026-09' : 'recent-30-days'
  } catch {
    return 'recent-30-days'
  }
}
const selectedPeriod = ref<AdminDashboardPeriodKey>(readSavedPeriod())
const loadedPeriod = ref<AdminDashboardPeriod | null>(null)
const periodDescription = computed(() => {
  if (!loadedPeriod.value) return ''
  const { startDate, endDate } = loadedPeriod.value
  return `${startDate.replaceAll('-', '/')}～${endDate.replaceAll('-', '/')}（台灣時間）`
})
let requestId = 0

const managementModules = computed<ManagementModule[]>(() => {
  if (!statistics.value) return []

  return [
    {
      eyebrow: 'USER MANAGEMENT',
      title: '玩家管理',
      route: '/admin/users',
      totalLabel: '使用者總數',
      totalValue: statistics.value.totalUsers,
      details: [
        { label: '玩家', value: statistics.value.totalPlayers },
        { label: '管理員', value: statistics.value.totalAdmins },
        { label: '近 7 天新增', value: statistics.value.newUsersLastSevenDays },
      ],
      tone: 'primary',
      icon: UsersRound,
    },
    {
      eyebrow: 'ARTICLE MANAGEMENT',
      title: '文章管理',
      route: '/admin/articles',
      totalLabel: '文章總數',
      totalValue: statistics.value.totalArticles,
      details: [
        { label: '已發布', value: statistics.value.publishedArticles },
        { label: '草稿', value: statistics.value.draftArticles },
      ],
      tone: 'secondary',
      icon: Files,
    },
    {
      eyebrow: 'PLAZA MANAGEMENT',
      title: '廣場管理',
      route: '/admin/plaza',
      totalLabel: '貼文總數',
      totalValue: statistics.value.totalPosts,
      details: [{ label: '留言', value: statistics.value.totalComments }],
      tone: 'accent',
      icon: MessageSquareText,
    },
  ]
})

const trendCards = computed(() => {
  if (!trend.value) return []

  const usersTotal = trend.value.users.reduce((sum, item) => sum + item.count, 0)
  const articlesTotal = trend.value.articles.reduce((sum, item) => sum + item.count, 0)
  const postsTotal = trend.value.plaza.reduce((sum, item) => sum + item.posts, 0)
  const commentsTotal = trend.value.plaza.reduce((sum, item) => sum + item.comments, 0)
  const summaryPeriod = loadedPeriod.value?.key === '2026-09' ? '9 月' : '近 30 天'

  return [
    {
      category: '玩家管理',
      title: '新註冊玩家趨勢',
      icon: UsersRound,
      dates: trend.value.users.map((item) => item.date),
      series: [
        {
          label: '新增玩家',
          data: trend.value.users.map((item) => item.count),
          tone: 'primary' as const,
        },
      ],
      summaryItems: [{ label: `${summaryPeriod}新增玩家`, value: usersTotal }],
      valueUnit: '人' as const,
    },
    {
      category: '文章管理',
      title: '文章發布趨勢',
      icon: Files,
      dates: trend.value.articles.map((item) => item.date),
      series: [
        {
          label: '發布文章',
          data: trend.value.articles.map((item) => item.count),
          tone: 'primary' as const,
        },
      ],
      summaryItems: [{ label: `${summaryPeriod}發布文章`, value: articlesTotal }],
      valueUnit: '篇' as const,
    },
    {
      category: '廣場管理',
      title: '貼文與留言趨勢',
      icon: MessageSquareText,
      dates: trend.value.plaza.map((item) => item.date),
      series: [
        {
          label: '貼文數',
          data: trend.value.plaza.map((item) => item.posts),
          tone: 'primary' as const,
        },
        {
          label: '留言數',
          data: trend.value.plaza.map((item) => item.comments),
          tone: 'accent' as const,
        },
      ],
      summaryItems: [
        { label: '貼文數', value: postsTotal, color: 'var(--color-primary)' },
        { label: '留言數', value: commentsTotal, color: 'var(--color-accent)' },
      ],
      valueUnit: '筆' as const,
    },
  ]
})

const loadDashboard = async () => {
  const currentRequestId = ++requestId
  isLoading.value = true
  errorMessage.value = ''
  trend.value = null
  loadedPeriod.value = null

  try {
    const response = await getAdminDashboard(selectedPeriod.value)

    // 快速切換時，較早送出的回應不能覆蓋目前選擇。
    if (currentRequestId !== requestId) return

    statistics.value = response.statistics
    trend.value = response.trend
    loadedPeriod.value = response.period
  } catch (error: unknown) {
    if (currentRequestId !== requestId) return
    if (isAxiosError(error)) {
      errorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法取得儀表板資料，請稍後再試'
    } else {
      errorMessage.value = '無法取得儀表板資料，請稍後再試'
    }
  } finally {
    if (currentRequestId === requestId) isLoading.value = false
  }
}

watch(selectedPeriod, (period) => {
  try {
    sessionStorage.setItem(periodStorageKey, period)
  } catch {
    // 瀏覽器停用儲存空間時，仍允許切換與查詢。
  }
  void loadDashboard()
})

onMounted(() => {
  void loadDashboard()
})

onBeforeUnmount(() => {
  requestId++
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dashboard-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-dark-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.dashboard-title {
  margin: 0 0 var(--space-2);

  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}

.dashboard-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);

  width: 100%;
}

.management-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.management-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-4);

  padding: var(--space-4);

  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-lg);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.management-card:hover {
  border-color: var(--color-primary-soft);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.management-card:focus-visible {
  outline: 3px solid var(--color-dark-light);
  outline-offset: 2px;
}

.management-card-header,
.management-card-identity {
  display: flex;
  align-items: center;
}

.management-card-header {
  justify-content: space-between;
  gap: var(--space-3);
}

.management-card-identity {
  min-width: 0;
  gap: var(--space-3);
}

.management-card-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;

  border-radius: var(--radius-md);
}

.management-card-icon :deep(svg),
.management-card-arrow {
  width: 24px;
  height: 24px;
}

.management-card--primary .management-card-icon,
.management-card--secondary .management-card-icon,
.management-card--accent .management-card-icon {
  color: var(--color-primary);
  background: var(--color-primary-pale);
}

.management-card-arrow {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
}

.management-card:hover .management-card-arrow {
  transform: translateX(var(--space-1));
}

.management-card-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-dark-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.management-card-title {
  margin: 0;
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.management-card-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);

  padding-bottom: var(--space-3);

  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.management-card-total strong {
  color: var(--color-text);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-tight);
}

.management-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);

  margin: 0;
}

.management-card-details div {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.management-card-details dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.management-card-details dd {
  margin: 0;
  font-weight: var(--font-weight-bold);
}

.trend-toolbar,
.trend-period-field {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.trend-toolbar {
  justify-content: space-between;
}

.trend-period-status {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  min-width: 0;
}

@media (max-width: 1200px) {
  .management-overview-grid,
  .trend-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  .management-overview-grid,
  .trend-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .error-content {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .management-card,
  .management-card-arrow {
    transition: none;
  }
}
</style>
