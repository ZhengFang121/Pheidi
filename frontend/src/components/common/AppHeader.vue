<template>
  <header class="app-header">
    <Toast position="top-right" />

    <div class="layout-container">
      <Menubar :model="navigationItems" aria-label="主要導覽列" class="main-menu">
        <!-- Logo -->
        <template #start>
          <RouterLink to="/home" class="logo-link" aria-label="回到首頁">
            <img src="/logo.svg" alt="跑者菲迪 Pheidi the Runner" class="logo-image" />
          </RouterLink>
        </template>

        <!-- 中間導覽選單 -->
        <template #item="{ item, props }">
          <RouterLink v-slot="{ href, navigate, isActive }" :to="item.route ?? '/'" custom>
            <a
              v-ripple
              :href="href"
              v-bind="props.action"
              :class="['root-menu-link', { 'is-active': isActive }]"
              @click="navigate"
            >
              <component
                :is="item.lucideIcon"
                v-if="item.lucideIcon"
                class="root-menu-icon"
                aria-hidden="true"
              />

              <span class="menu-text">
                <span class="menu-label">
                  {{ item.label }}
                </span>

                <span v-if="item.labelEn" class="menu-label-en">
                  {{ item.labelEn }}
                </span>
              </span>
            </a>
          </RouterLink>
        </template>

        <!-- 右側功能 -->
        <template #end>
          <div class="header-actions">
            <!-- 打卡按鈕 -->
            <button
              type="button"
              class="header-action-button check-in-button"
              data-progression-return-focus
              aria-label="開啟跑步打卡視窗"
              :aria-expanded="isCheckInDialogVisible"
              aria-controls="check-in-dialog"
              @click="isCheckInDialogVisible = true"
            >
              <NotebookPen class="header-action-icon" aria-hidden="true" />
            </button>

            <!-- 玩家頭像按鈕 -->
            <button
              type="button"
              class="header-action-button avatar-button"
              aria-label="開啟玩家選單"
              aria-haspopup="true"
              :aria-expanded="isAccountMenuVisible"
              @click="toggleAccountMenu"
            >
              <CircleUserRound class="player-icon" aria-hidden="true" />
            </button>

            <!-- 玩家下拉選單 -->
            <Menu
              ref="accountMenu"
              :model="accountItems"
              popup
              class="account-menu"
              @show="isAccountMenuVisible = true"
              @hide="isAccountMenuVisible = false"
            >
              <template #item="{ item, props }">
                <a v-ripple v-bind="props.action" class="account-menu-link">
                  <component
                    :is="item.lucideIcon"
                    v-if="item.lucideIcon"
                    class="account-menu-icon"
                    aria-hidden="true"
                  />
                  <span class="account-menu-label">{{ item.label }}</span>
                </a>
              </template>
            </Menu>
          </div>
        </template>
      </Menubar>
    </div>

    <!-- 打卡彈出視窗 -->
    <!-- 打卡彈出視窗 -->
    <Dialog
      id="check-in-dialog"
      v-model:visible="isCheckInDialogVisible"
      modal
      header="今日跑步打卡"
      :draggable="false"
      :style="{ width: '44rem' }"
      :breakpoints="{ '768px': 'calc(100vw - 32px)' }"
      :content-style="{
        maxHeight: 'calc(100vh - 10rem)',
        overflowY: 'auto',
      }"
    >
      <RunRecordForm
        v-if="isCheckInDialogVisible"
        @submitted="handleRunRecordSubmitted"
        @cancel="isCheckInDialogVisible = false"
      />
    </Dialog>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import {
  CircleUserRound,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  NotebookPen,
  Send,
  Settings,
  SportShoe,
} from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'
import RunRecordForm from '@/components/run/RunRecordForm.vue'

interface NavigationItem extends MenuItem {
  labelEn?: string
  route?: string
  lucideIcon?: Component
}

interface AccountMenuItem extends MenuItem {
  lucideIcon?: Component
}

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const accountMenu = ref<InstanceType<typeof Menu> | null>(null)

const isAccountMenuVisible = ref(false)
const isCheckInDialogVisible = ref(false)

function toggleAccountMenu(event: MouseEvent) {
  accountMenu.value?.toggle(event)
}

function handleRunRecordSubmitted() {
  isCheckInDialogVisible.value = false

  toast.add({
    severity: 'success',
    summary: '打卡成功',
    detail: '跑步紀錄已成功儲存。',
    life: 3000,
  })
}

async function handleLogout() {
  authStore.logout()

  await router.replace('/')
}

const accountItems = computed<AccountMenuItem[]>(() => {
  const items: AccountMenuItem[] = [
    {
      label: '帳號設定',
      lucideIcon: Settings,
      command: () => {
        router.push('/account')
      },
    },
  ]

  if (authStore.isAdmin) {
    items.push({
      label: '後台管理',
      lucideIcon: LayoutDashboard,
      command: () => {
        router.push('/admin')
      },
    })
  }

  items.push(
    {
      separator: true,
    },
    {
      label: '登出',
      lucideIcon: LogOut,
      command: handleLogout,
    },
  )

  return items
})

const navigationItems = ref<NavigationItem[]>([
  {
    label: '足跡驛站',
    labelEn: 'Trail Station',
    lucideIcon: SportShoe,
    route: '/station',
  },
  {
    label: '跑者學院',
    labelEn: 'PR Academy',
    lucideIcon: LibraryBig,
    route: '/academy',
  },
  {
    label: '菲迪廣場',
    labelEn: 'Pheidi Plaza',
    lucideIcon: Send,
    route: '/plaza',
  },
])
</script>

<style scoped>
.app-header {
  position: relative;
  z-index: 100;

  width: 100%;

  background: var(--color-primary-pale);
}

/* Menubar */
:deep(.main-menu.p-menubar) {
  width: 100%;
  min-height: var(--app-header-height);
  padding: 0;

  background: transparent;
  border: 0;
  border-radius: 0;
}

:deep(.main-menu .p-menubar-start) {
  flex-shrink: 0;
  margin-right: auto;
}

:deep(.main-menu .p-menubar-root-list) {
  justify-content: center;
  gap: var(--space-7);
  margin-inline: auto;
}

:deep(.main-menu .p-menubar-end) {
  flex-shrink: 0;
  margin-left: auto;
}

/* 移除 PrimeVue 主選單所有狀態的背景色 */
:deep(.main-menu .p-menubar-root-list > .p-menubar-item > .p-menubar-item-content) {
  background: transparent !important;
}

:deep(.main-menu .p-menubar-root-list > .p-menubar-item > .p-menubar-item-content:hover) {
  background: transparent !important;
}

:deep(.main-menu .p-menubar-root-list > .p-menubar-item.p-focus > .p-menubar-item-content) {
  background: transparent !important;
}

:deep(.main-menu .p-menubar-root-list > .p-menubar-item.p-highlight > .p-menubar-item-content) {
  background: transparent !important;
}

:deep(
  .main-menu .p-menubar-root-list > .p-menubar-item.p-menubar-item-active > .p-menubar-item-content
) {
  background: transparent !important;
}

/* Logo */
.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-image {
  display: block;
  width: auto;
  height: 60px;
}

/* 主選單 */
.root-menu-link {
  display: flex;
  align-items: center;
  gap: 12px;

  min-height: 72px;
  padding: 12px 16px;

  color: var(--color-primary);
  text-decoration: none;

  background: transparent !important;
  border-radius: 16px;

  transition: color 0.2s ease;
}

.root-menu-link:hover,
.root-menu-link:focus,
.root-menu-link:focus-visible,
.root-menu-link.is-active {
  color: var(--color-accent);
  background: transparent !important;
}

.root-menu-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  stroke-width: 2;
}

.menu-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: 1.2;
  letter-spacing: 0.3em;
  white-space: nowrap;
}

.menu-label-en {
  font-family: var(--font-family-base);
  font-size: 10px;
  font-weight: var(--font-weight-regular);
  line-height: 1.2;
  letter-spacing: var(--letter-spacing-wide);
  white-space: nowrap;
}

/* 右側功能 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 35px;
  height: 35px;
  padding: 0;

  color: var(--color-primary);

  cursor: pointer;

  background: transparent;
  border: 0;
  border-radius: 50%;

  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.header-action-button:hover {
  color: var(--color-accent);
  background: transparent;
  transform: translateY(-2px);
}

.header-action-button:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 3px;
}

/* 打卡按鈕 */
.check-in-button {
  color: white;
  background: var(--color-primary);
}

.check-in-button:hover {
  color: white;
  background: var(--color-accent);
}

.header-action-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2.5;
}

/* 玩家 */
.player-icon {
  width: 35px;
  height: 35px;
  stroke-width: 2;
}

/* 玩家下拉選單 */
:global(.account-menu.p-menu) {
  min-width: 180px;
  padding: 8px;

  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(60 67 94 / 12%);
}

:global(.account-menu-link) {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  min-height: 44px;
  padding: 10px 12px;

  color: var(--color-primary);
  text-decoration: none;

  border-radius: 8px;

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

:global(.account-menu-link:hover),
:global(.account-menu-link:focus-visible) {
  color: var(--color-accent);
  background: var(--color-primary-pale);
}

:global(.account-menu-icon) {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: currentColor;
  stroke-width: 2;
}

:global(.account-menu-label) {
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--letter-spacing-wide);
}

/* 打卡視窗 */

/* 平板尺寸 */
@media (max-width: 1100px) {
  :deep(.main-menu .p-menubar-root-list) {
    gap: var(--space-2);
  }

  .menu-label-en {
    display: none;
  }

  .root-menu-link {
    padding-inline: 10px;
  }
}
</style>
