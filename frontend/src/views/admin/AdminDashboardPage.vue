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

    <div v-if="isLoading" class="management-overview-grid">
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

    <BaseCard as="section" class="latest-users-panel">
      <div class="panel-heading">
        <div>
          <p class="panel-eyebrow">LATEST USERS</p>
          <h3 class="panel-title">最新註冊使用者</h3>
        </div>

        <RouterLink to="/admin/users" class="view-all-link">
          查看全部玩家
          <ArrowRight class="view-all-icon" aria-hidden="true" />
        </RouterLink>
      </div>

      <DataTable
        :value="latestUsers"
        :loading="isLoading"
        striped-rows
        scrollable
        table-style="min-width: 640px"
        class="latest-users-table"
      >
        <template #empty>
          <div class="table-empty">目前還沒有使用者資料</div>
        </template>

        <Column field="username" header="跑者名稱" />

        <Column field="email" header="Email" />

        <Column field="role" header="身分">
          <template #body="{ data }">
            <Tag
              :value="data.role === 'admin' ? '管理員' : '玩家'"
              :severity="data.role === 'admin' ? 'warn' : 'secondary'"
            />
          </template>
        </Column>

        <Column field="createdAt" header="註冊日期">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
      </DataTable>
    </BaseCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { isAxiosError } from 'axios'
import { ArrowRight, Files, MessageSquareText, UsersRound } from '@lucide/vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

import BaseButton from '@/components/base/BaseButton.vue'

import BaseCard from '@/components/base/BaseCard.vue'
import { getAdminDashboard } from '@/services/adminDashboard'
import type { AdminDashboardStatistics, AdminLatestUser } from '@/types/user'
import { formatNumericDate } from '@/utils/date'

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
const latestUsers = ref<AdminLatestUser[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

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

const formatDate = (date: string) => {
  return formatNumericDate(date, 'Asia/Taipei')
}

const loadDashboard = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminDashboard()

    statistics.value = response.statistics
    latestUsers.value = response.latestUsers
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      errorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法取得儀表板資料，請稍後再試'
    } else {
      errorMessage.value = '無法取得儀表板資料，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadDashboard()
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dashboard-eyebrow,
.panel-eyebrow {
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

.management-card--primary .management-card-icon {
  color: var(--color-primary);
  background: var(--color-primary-pale);
}

.management-card--secondary .management-card-icon {
  color: var(--color-secondary);
  background: var(--color-secondary-pale);
}

.management-card--accent .management-card-icon {
  color: var(--color-accent);
  background: var(--color-accent-pale);
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

.latest-users-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-4);

  border-radius: var(--radius-lg);
}

.panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.panel-title {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);

  color: var(--color-dark-light);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.view-all-link:hover {
  color: var(--color-dark);
}

.view-all-icon {
  width: 18px;
  height: 18px;
}

.table-empty {
  padding: var(--space-4);

  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 1200px) {
  .management-overview-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .panel-heading,
  .error-content {
    align-items: flex-start;
    flex-direction: column;
  }

  .latest-users-panel {
    padding: var(--space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .management-card,
  .management-card-arrow {
    transition: none;
  }
}
</style>
