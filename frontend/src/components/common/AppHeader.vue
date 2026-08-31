<template>
  <header class="app-header">
    <Toast position="top-right" />

    <div class="app-header__container layout-container">
      <BaseCard as="div" variant="glass" class="navigation-shell">
        <Menubar
          :model="navigationItems"
          breakpoint="0px"
          aria-label="主要導覽列"
          class="main-menu"
        >
          <!-- Logo -->
          <template #start>
            <RouterLink to="/home" class="logo-link" aria-label="回到首頁">
              <img src="/logo.svg" alt="跑者菲迪 Pheidi the Runner" class="logo-image" />
            </RouterLink>
          </template>

          <!-- 中間導覽選單 -->
          <template #item="{ item, props }">
            <RouterLink v-slot="{ href, navigate, isActive }" :to="item.route ?? '/'" custom>
              <BaseIconAction
                v-ripple
                as="a"
                :label="typeof item.label === 'string' ? item.label : ''"
                :href="href"
                v-bind="props.action"
                :class="['root-menu-link', { 'is-active': isActive }]"
                :aria-current="isActive ? 'page' : undefined"
                @click="navigate"
              >
                <template #icon>
                  <component :is="item.lucideIcon" v-if="item.lucideIcon" class="root-menu-icon" />
                </template>

                <template #label>
                  <span class="menu-label-stack">
                    <span class="menu-label">
                      {{ typeof item.label === 'string' ? item.label : '' }}
                    </span>

                    <span v-if="item.labelEn" class="menu-label-en">
                      {{ item.labelEn }}
                    </span>
                  </span>
                </template>
              </BaseIconAction>
            </RouterLink>
          </template>

          <!-- 右側功能 -->
          <template #end>
            <div class="header-actions">
              <!-- 打卡按鈕 -->
              <BaseIconAction
                type="button"
                label="跑步打卡"
                class="header-action-button check-in-button"
                data-progression-return-focus
                aria-label="開啟跑步打卡視窗"
                :aria-expanded="isCheckInDialogVisible"
                aria-controls="check-in-dialog"
                @click="isCheckInDialogVisible = true"
              >
                <template #icon>
                  <NotebookPen class="header-action-icon" />
                </template>

                <template #label>
                  <span class="menu-label-stack">
                    <span class="menu-label">跑步打卡</span>
                    <span class="menu-label-en">Run Check-in</span>
                  </span>
                </template>
              </BaseIconAction>

              <!-- 玩家頭像按鈕 -->
              <BaseIconAction
                type="button"
                label="玩家選單"
                class="header-action-button avatar-button"
                aria-label="開啟玩家選單"
                aria-haspopup="true"
                :aria-expanded="isAccountMenuVisible"
                @click="toggleAccountMenu"
              >
                <template #icon>
                  <CircleUserRound class="player-icon" />
                </template>

                <template #label>
                  <span class="menu-label-stack">
                    <span class="menu-label">玩家選單</span>
                    <span class="menu-label-en">Player Menu</span>
                  </span>
                </template>
              </BaseIconAction>

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
      </BaseCard>
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
import BaseCard from '@/components/base/BaseCard.vue'
import BaseIconAction from '@/components/base/BaseIconAction.vue'
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
  height: var(--app-header-height);
  padding-block: var(--space-5) var(--space-3);
  background: transparent;
}

.app-header__container,
.navigation-shell {
  height: 100%;
}

.navigation-shell {
  padding-inline: var(--space-4);
  border-radius: var(--radius-full);
}

/* Menubar */
:deep(.main-menu.p-menubar) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: var(--space-4);
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

:deep(.main-menu .p-menubar-start) {
  min-width: 0;
  margin: 0;
  justify-self: start;
}

:deep(.main-menu .p-menubar-root-list) {
  position: static;
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin: 0;
  justify-self: center;
}

:deep(.main-menu .p-menubar-end) {
  min-width: 0;
  margin: 0;
  justify-self: end;
}

:deep(.main-menu .p-menubar-button) {
  display: none;
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
  min-width: 0;
  text-decoration: none;
}

.logo-image {
  display: block;
  width: auto;
  height: 44px;
}

/* 主選單 */
.root-menu-link {
  --base-icon-action-expanded-width: 180px;

  justify-content: center;
  gap: var(--space-2);
  width: var(--base-icon-action-expanded-width);
  max-width: var(--base-icon-action-expanded-width);
  padding-inline: var(--space-3);
  color: var(--color-surface) !important;
  background: linear-gradient(
    90deg,
    var(--color-primary) 0%,
    var(--color-primary-soft) 50%,
    var(--color-primary) 100%
  );
  transition:
    background-color 200ms ease,
    box-shadow 200ms ease,
    transform 200ms ease;
}

.root-menu-link:hover,
.root-menu-link:focus-visible,
.root-menu-link.is-active {
  color: var(--color-surface) !important;
  background: linear-gradient(
    90deg,
    var(--color-secondary) 0%,
    var(--color-secondary-soft) 50%,
    var(--color-secondary) 100%
  );
}

.root-menu-link:hover::before,
.root-menu-link:focus-visible::before,
.root-menu-link.is-active::before {
  background: linear-gradient(
    90deg,
    var(--color-secondary) 0%,
    var(--color-secondary-soft) 50%,
    var(--color-secondary) 100%
  );
}

:deep(.root-menu-link .base-icon-action__label) {
  max-width: none;
  overflow: visible;
  opacity: 1;
  letter-spacing: var(--letter-spacing-base);
  transform: none;
  transition: none;
}

.root-menu-icon {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

.menu-label-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-wide);
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
  gap: var(--space-2);
}

.header-action-button {
  --base-icon-action-expanded-width: 164px;
}

.header-action-button:hover,
.header-action-button:focus-visible,
.header-action-button:active,
.header-action-button[aria-expanded='true'] {
  background: linear-gradient(
    90deg,
    var(--color-secondary) 0%,
    var(--color-secondary-soft) 50%,
    var(--color-secondary) 100%
  );
}

.header-action-button:hover::before,
.header-action-button:focus-visible::before,
.header-action-button:active::before,
.header-action-button[aria-expanded='true']::before {
  background: linear-gradient(
    90deg,
    var(--color-secondary) 0%,
    var(--color-secondary-soft) 50%,
    var(--color-secondary) 100%
  );
}

.header-action-icon,
.player-icon {
  width: 22px;
  height: 22px;
  stroke-width: 2;
}

/* 玩家下拉選單 */
:global(.account-menu.p-menu) {
  min-width: 180px;
  padding: 8px;

  border-radius: 12px;
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
  .root-menu-link {
    --base-icon-action-expanded-width: 140px;
  }

  .logo-image {
    height: 28px;
  }
}

@media (max-width: 900px) {
  .navigation-shell {
    padding-inline: var(--space-2);
  }

  :deep(.main-menu.p-menubar) {
    gap: var(--space-2);
  }

  .root-menu-link {
    --base-icon-action-expanded-width: 128px;
  }

  :deep(.main-menu .p-menubar-root-list) {
    gap: var(--space-1);
  }

  .root-menu-link .menu-label-en {
    display: none;
  }
}

@media (max-width: 768px) {
  .root-menu-link {
    --base-icon-action-expanded-width: 116px;
    --base-icon-action-size: 42px;
    gap: var(--space-1);
    padding-inline: var(--space-2);
  }

  .header-action-button {
    --base-icon-action-size: 42px;
  }
}

@media (max-width: 640px) {
  .root-menu-link {
    gap: 0;
    width: var(--base-icon-action-size);
    max-width: var(--base-icon-action-size);
    padding-inline: calc((var(--base-icon-action-size) - 24px) / 2);
  }

  :deep(.root-menu-link .base-icon-action__label) {
    display: none;
  }
}

@media (max-width: 480px) {
  :deep(.main-menu.p-menubar) {
    grid-template-columns: auto auto auto;
    gap: 0;
    justify-content: space-between;
  }

  .logo-link {
    width: 38px;
    height: 38px;
    overflow: hidden;
  }

  .logo-image {
    max-width: none;
    height: 38px;
  }

  .root-menu-link,
  .header-action-button {
    --base-icon-action-size: 38px;
  }

  :deep(.main-menu .p-menubar-root-list),
  .header-actions {
    gap: var(--space-1);
  }
}
</style>
