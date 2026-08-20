<template>
  <section class="dashboard-page">
    <div class="dashboard-heading">
      <div>
        <p class="dashboard-eyebrow">HOME</p>
        <h2 class="dashboard-title">首頁</h2>
        <p class="dashboard-description">
          查看跑者菲迪目前的使用者統計與最新註冊狀態。
        </p>
      </div>
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">
      <div class="error-content">
        <span>{{ errorMessage }}</span>

        <Button
          type="button"
          label="重新載入"
          severity="secondary"
          size="small"
          @click="loadDashboard"
        />
      </div>
    </Message>

    <div v-if="isLoading" class="statistics-grid">
      <Skeleton
        v-for="index in 4"
        :key="index"
        width="100%"
        height="9rem"
        border-radius="var(--radius-lg)"
      />
    </div>

    <div v-else-if="statistics" class="statistics-grid">
      <article
        v-for="card in statisticCards"
        :key="card.label"
        class="statistic-card"
      >
        <div :class="['statistic-icon', `statistic-icon--${card.tone}`]">
          <component :is="card.icon" aria-hidden="true" />
        </div>

        <div>
          <p class="statistic-label">{{ card.label }}</p>
          <strong class="statistic-value">{{ card.value }}</strong>
          <p class="statistic-description">{{ card.description }}</p>
        </div>
      </article>
    </div>

    <section class="latest-users-panel">
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
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { isAxiosError } from 'axios'
import {
  ArrowRight,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from '@lucide/vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

import {
  getAdminDashboard,
  type AdminDashboardStatistics,
  type AdminLatestUser,
} from '@/services/admin'

interface StatisticCard {
  label: string
  value: number
  description: string
  tone: 'primary' | 'secondary' | 'accent' | 'dark'
  icon: Component
}

const statistics = ref<AdminDashboardStatistics | null>(null)
const latestUsers = ref<AdminLatestUser[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const statisticCards = computed<StatisticCard[]>(() => {
  if (!statistics.value) return []

  return [
    {
      label: '使用者總數',
      value: statistics.value.totalUsers,
      description: '包含玩家與管理員',
      tone: 'primary',
      icon: UsersRound,
    },
    {
      label: '玩家數量',
      value: statistics.value.totalPlayers,
      description: '目前的一般玩家',
      tone: 'secondary',
      icon: UserRound,
    },
    {
      label: '管理員數量',
      value: statistics.value.totalAdmins,
      description: '具備後台權限',
      tone: 'accent',
      icon: ShieldCheck,
    },
    {
      label: '近 7 天新增',
      value: statistics.value.newUsersLastSevenDays,
      description: '最近加入的使用者',
      tone: 'dark',
      icon: UserPlus,
    },
  ]
})

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Taipei',
  }).format(new Date(date))
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

  color: var(--color-primary);
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

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.statistic-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);

  min-width: 0;
  padding: var(--space-3);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.statistic-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;

  border-radius: var(--radius-md);
}

.statistic-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.statistic-icon--primary {
  color: var(--color-primary);
  background: var(--color-primary-pale);
}

.statistic-icon--secondary {
  color: var(--color-secondary);
  background: var(--color-secondary-pale);
}

.statistic-icon--accent {
  color: var(--color-accent);
  background: var(--color-accent-pale);
}

.statistic-icon--dark {
  color: white;
  background: var(--color-dark);
}

.statistic-label {
  margin: 0 0 var(--space-1);

  color: var(--color-text-secondary);
  font-size: var(--font-size-body-small);
}

.statistic-value {
  display: block;

  margin-bottom: var(--space-1);

  color: var(--color-text);
  font-size: var(--font-size-h2);
  line-height: 1;
}

.statistic-description {
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-caption);
}

.latest-users-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-4);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
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
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);

  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.view-all-link:hover {
  color: var(--color-accent);
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
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .panel-heading,
  .error-content {
    align-items: flex-start;
    flex-direction: column;
  }

  .latest-users-panel {
    padding: var(--space-3);
  }
}
</style>
