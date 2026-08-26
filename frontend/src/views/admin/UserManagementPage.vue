<template>
  <section class="user-management-page">
    <ConfirmDialog />

    <div class="page-heading">
      <div>
        <p class="page-eyebrow">USER MANAGEMENT</p>
        <h2 class="page-title">玩家管理</h2>
        <p class="page-description">查看跑者菲迪的玩家帳號、角色與註冊時間。</p>
      </div>

    </div>

    <AdminStatisticsStrip
      :items="statisticItems"
      label="玩家統計"
      :loading="isStatisticsLoading"
    />

    <Message v-if="statisticsErrorMessage" severity="error" :closable="false">
      {{ statisticsErrorMessage }}
    </Message>

    <div class="management-panel">
      <form class="search-form" @submit.prevent="handleSearch">
        <label for="user-search" class="search-label">搜尋玩家</label>

        <div class="search-controls">
          <InputText
            id="user-search"
            v-model="searchInput"
            type="search"
            placeholder="輸入跑者名稱或 Email"
            class="search-input"
          />

          <Button type="submit" label="搜尋" :loading="isLoading" />

          <Button
            v-if="activeSearch"
            type="button"
            label="清除"
            severity="secondary"
            outlined
            @click="clearSearch"
          />
        </div>
      </form>

      <Message v-if="successMessage" severity="success" :closable="false">
        {{ successMessage }}
      </Message>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <DataTable
        :value="users"
        :loading="isLoading"
        :first="first"
        :rows="pagination.limit"
        :total-records="pagination.total"
        :rows-per-page-options="[5, 10, 20, 50]"
        lazy
        paginator
        striped-rows
        scrollable
        table-style="min-width: 760px"
        paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        current-page-report-template="第 {currentPage} 頁，共 {totalPages} 頁"
        class="user-table"
        @page="handlePageChange"
      >
        <template #empty>
          <div class="table-empty">
            {{ activeSearch ? '找不到符合搜尋條件的使用者' : '目前還沒有使用者資料' }}
          </div>
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

        <Column field="updatedAt" header="最後更新">
          <template #body="{ data }">
            {{ formatDate(data.updatedAt) }}
          </template>
        </Column>

        <Column header="角色操作">
          <template #body="{ data }">
            <Button
              type="button"
              :label="data.role === 'admin' ? '設為玩家' : '設為管理員'"
              :severity="data.role === 'admin' ? 'warn' : undefined"
              size="small"
              outlined
              :loading="updatingUserId === data.id"
              :disabled="data.id === authStore.user?.id"
              :title="data.id === authStore.user?.id ? '不能修改自己的管理員角色' : undefined"
              @click="confirmRoleChange(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { isAxiosError } from 'axios'

import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'

import AdminStatisticsStrip from '@/components/admin/AdminStatisticsStrip.vue'
import {
  getAdminUsers,
  getAdminUserStatistics,
  updateAdminUserRole,
} from '@/services/adminUsers'

import { useAuthStore } from '@/stores/auth'
import type { Pagination } from '@/types/api'
import type { AdminUser, AdminUserStatistics } from '@/types/user'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatNumericDate } from '@/utils/date'

interface PageEvent {
  first: number
  rows: number
  page: number
}

const confirm = useConfirm()
const authStore = useAuthStore()

const users = ref<AdminUser[]>([])
const searchInput = ref('')
const activeSearch = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const updatingUserId = ref<string | null>(null)
const isStatisticsLoading = ref(false)
const statisticsErrorMessage = ref('')
const statistics = reactive<AdminUserStatistics>({
  totalUsers: 0,
  totalPlayers: 0,
  totalAdmins: 0,
  newUsersLastSevenDays: 0,
})

const pagination = reactive<Pagination>({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
})

const first = computed(() => (pagination.page - 1) * pagination.limit)
const statisticItems = computed(() => [
  { label: '使用者總數', value: statistics.totalUsers, icon: 'pi pi-users' },
  { label: '玩家數量', value: statistics.totalPlayers, icon: 'pi pi-user' },
  { label: '管理員數量', value: statistics.totalAdmins, icon: 'pi pi-shield' },
  { label: '近 7 天新增', value: statistics.newUsersLastSevenDays, icon: 'pi pi-user-plus' },
])

const formatDate = (date: string) => {
  return formatNumericDate(date)
}

const loadUserStatistics = async () => {
  isStatisticsLoading.value = true
  statisticsErrorMessage.value = ''

  try {
    const response = await getAdminUserStatistics()
    Object.assign(statistics, response.statistics)
  } catch (error: unknown) {
    statisticsErrorMessage.value = getApiErrorMessage(error, '無法取得玩家統計，請稍後再試')
  } finally {
    isStatisticsLoading.value = false
  }
}

const loadUsers = async (page = pagination.page, limit = pagination.limit) => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await getAdminUsers({
      page,
      limit,
      search: activeSearch.value || undefined,
    })

    users.value = response.users
    Object.assign(pagination, response.pagination)
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      errorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法取得玩家列表，請稍後再試'
    } else {
      errorMessage.value = '無法取得玩家列表，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

const handleSearch = async () => {
  activeSearch.value = searchInput.value.trim()

  await loadUsers(1, pagination.limit)
}

const clearSearch = async () => {
  searchInput.value = ''
  activeSearch.value = ''

  await loadUsers(1, pagination.limit)
}

const handlePageChange = async (event: PageEvent) => {
  await loadUsers(event.page + 1, event.rows)
}

const updateUserRole = async (user: AdminUser) => {
  const nextRole: AdminUser['role'] = user.role === 'admin' ? 'player' : 'admin'

  updatingUserId.value = user.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await updateAdminUserRole(user.id, nextRole)

    users.value = users.value.map((currentUser) =>
      currentUser.id === response.user.id ? response.user : currentUser,
    )

    await loadUserStatistics()
    successMessage.value = response.message
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      errorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法修改使用者角色，請稍後再試'
    } else {
      errorMessage.value = '無法修改使用者角色，請稍後再試'
    }
  } finally {
    updatingUserId.value = null
  }
}

const confirmRoleChange = (user: AdminUser) => {
  const nextRoleLabel = user.role === 'admin' ? '玩家' : '管理員'

  confirm.require({
    header: '確認變更使用者角色',
    message: `確定要將「${user.username}」設為${nextRoleLabel}嗎？`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確認變更',
    rejectLabel: '取消',
    accept: () => {
      void updateUserRole(user)
    },
  })
}

onMounted(() => {
  void Promise.all([loadUserStatistics(), loadUsers()])
})
</script>

<style scoped>
.user-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.page-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.page-title {
  margin: 0 0 var(--space-2);

  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}

.page-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.management-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-4);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.search-label {
  color: var(--color-text);
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
}

.search-controls {
  display: flex;
  gap: var(--space-2);
}

.search-input {
  width: min(100%, 420px);
}

.table-empty {
  padding: var(--space-4);

  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 768px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .management-panel {
    padding: var(--space-3);
  }

  .search-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}
</style>
