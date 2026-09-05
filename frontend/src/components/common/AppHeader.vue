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

              <BaseIconAction
                type="button"
                label="導覽選單"
                class="header-action-button mobile-menu-button"
                data-progression-return-focus
                aria-label="開啟導覽選單"
                aria-haspopup="true"
                aria-controls="mobile-navigation-menu"
                :aria-expanded="isMobileMenuVisible"
                @click="toggleMobileMenu"
              >
                <template #icon>
                  <MenuIcon class="header-action-icon" />
                </template>
                <template #label>
                  <span class="menu-label-stack">
                    <span class="menu-label">導覽選單</span>
                    <span class="menu-label-en">Navigation</span>
                  </span>
                </template>
              </BaseIconAction>

              <Menu
                id="mobile-navigation-menu"
                ref="mobileMenu"
                :model="mobileMenuItems"
                :style="{ width: mobileMenuWidth }"
                popup
                class="account-menu mobile-navigation-menu"
                aria-label="導覽選單"
                @show="handleMobileMenuShow"
                @hide="isMobileMenuVisible = false"
              >
                <template #item="{ item, props }">
                  <a
                    v-ripple
                    v-bind="props.action"
                    :href="item.route ? router.resolve(item.route).href : undefined"
                    :aria-current="isMobileRouteActive(item.route) ? 'page' : undefined"
                    class="base-button base-button--primary account-menu-link"
                    :class="{ 'is-active': isMobileRouteActive(item.route) }"
                    @click.prevent
                  >
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

              <!-- 玩家下拉選單 -->
              <Menu
                id="account-navigation-menu"
                ref="accountMenu"
                :model="accountItems"
                :style="{ width: accountMenuWidth }"
                popup
                class="account-menu"
                @show="handleAccountMenuShow"
                @hide="isAccountMenuVisible = false"
              >
                <template #item="{ item, props }">
                  <a
                    v-ripple
                    v-bind="props.action"
                    class="base-button base-button--primary account-menu-link"
                  >
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
    <Dialog
      id="check-in-dialog"
      v-model:visible="isCheckInDialogVisible"
      modal
      header="今日跑步打卡"
      :draggable="false"
      :closable="!isRunRecordSubmitting"
      :close-on-escape="!isRunRecordSubmitting"
      :pt="{ mask: { class: 'run-record-dialog-mask' } }"
      class="run-record-dialog"
    >
      <RunRecordForm
        v-if="isCheckInDialogVisible"
        @submitted="handleRunRecordSubmitted"
        @cancel="isCheckInDialogVisible = false"
        @submitting-change="isRunRecordSubmitting = $event"
      />
    </Dialog>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  Menu as MenuIcon,
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
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const accountMenu = ref<InstanceType<typeof Menu> | null>(null)
const accountMenuWidth = ref<string>()
const mobileMenu = ref<InstanceType<typeof Menu> | null>(null)
const mobileMenuWidth = ref<string>()
const isMobileMenuVisible = ref(false)
let accountMenuTrigger: HTMLElement | null = null
let mobileMenuTrigger: HTMLElement | null = null
let mobileBreakpoint: MediaQueryList | undefined

function getExpandedWidth(trigger: HTMLElement) {
  return window
    .getComputedStyle(trigger)
    .getPropertyValue('--base-icon-action-expanded-width')
    .trim()
}

function setMenuWidth(trigger: HTMLElement, menuWidth: typeof accountMenuWidth) {
  menuWidth.value = getExpandedWidth(trigger) || `${trigger.offsetWidth}px`
}

function alignMenuToTrigger(trigger: HTMLElement | null, menuId: string) {
  const menu = document.getElementById(menuId)
  if (!trigger || !menu) return

  const triggerRect = trigger.getBoundingClientRect()
  const expandedWidth = Number.parseFloat(getExpandedWidth(trigger)) || triggerRect.width
  const triggerCenter = triggerRect.right - expandedWidth / 2
  const menuWidth = menu.getBoundingClientRect().width

  menu.style.left = `${triggerCenter - menuWidth / 2 + window.scrollX}px`
}

function toggleMobileMenu(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) {
    mobileMenuTrigger = event.currentTarget
    setMenuWidth(event.currentTarget, mobileMenuWidth)
  }
  mobileMenu.value?.toggle(event)
}

async function handleMobileMenuShow() {
  isMobileMenuVisible.value = true
  await nextTick()
  alignMenuToTrigger(mobileMenuTrigger, 'mobile-navigation-menu')
}

function closeNavigationMenus() {
  accountMenu.value?.hide()
  mobileMenu.value?.hide()
}

onMounted(() => {
  // 與下方窄版 CSS 使用相同斷點，避免切換版面後留下 popup。
  mobileBreakpoint = window.matchMedia('(max-width: 900px)')
  mobileBreakpoint.addEventListener('change', closeNavigationMenus)
})

onUnmounted(() => {
  mobileBreakpoint?.removeEventListener('change', closeNavigationMenus)
})

function isMobileRouteActive(target?: string) {
  return !!target && (route.path === target || route.path.startsWith(`${target}/`))
}

async function openMobileCheckIn() {
  mobileMenu.value?.hide()
  await nextTick()
  mobileMenuTrigger?.focus()
  isCheckInDialogVisible.value = true
}

const isAccountMenuVisible = ref(false)
const isCheckInDialogVisible = ref(false)
const isRunRecordSubmitting = ref(false)

function toggleAccountMenu(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) {
    accountMenuTrigger = event.currentTarget
    setMenuWidth(event.currentTarget, accountMenuWidth)
  }

  accountMenu.value?.toggle(event)
}

async function handleAccountMenuShow() {
  isAccountMenuVisible.value = true
  await nextTick()
  alignMenuToTrigger(accountMenuTrigger, 'account-navigation-menu')
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

  items.push({
    label: '登出帳號',
    lucideIcon: LogOut,
    command: handleLogout,
  })

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

const mobileMenuItems = computed<NavigationItem[]>(() => [
  ...navigationItems.value.map((item) => ({
    ...item,
    command: () => {
      if (item.route) router.push(item.route)
    },
  })),
  { label: '跑步打卡', lucideIcon: NotebookPen, command: openMobileCheckIn },
  ...accountItems.value,
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
  gap: var(--space-3);
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
.root-menu-link,
.header-action-button {
  --base-icon-action-expanded-width: 168px;
  --header-action-gap: var(--space-3);

  justify-content: center;
  width: var(--base-icon-action-expanded-width);
  flex-shrink: 0;
  padding-inline: var(--space-3);
}

.root-menu-link {
  max-width: var(--base-icon-action-expanded-width);
}

.root-menu-link,
.header-action-button:is(:hover, :focus-visible, :active, [aria-expanded='true']) {
  gap: var(--header-action-gap);
}

.root-menu-link.is-active,
.header-action-button[aria-expanded='true'] {
  color: var(--color-surface) !important;
  background: linear-gradient(
    90deg,
    var(--color-secondary) 0%,
    var(--color-secondary-soft) 50%,
    var(--color-secondary) 100%
  );
  background-size: 220% 100%;
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
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.menu-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  letter-spacing: calc(var(--letter-spacing-wide) + var(--letter-spacing-tight));
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
  gap: var(--space-3);
}

.mobile-menu-button {
  display: none;
}

:global(.mobile-navigation-menu.p-menu) {
  max-height: calc(100dvh - var(--app-header-height) - var(--space-4));
  overflow-y: auto;
}

:global(.mobile-navigation-menu .account-menu-label) {
  white-space: nowrap;
}

.header-action-icon,
.player-icon {
  width: 22px;
  height: 22px;
  stroke-width: 2;
}

/* 玩家下拉選單 */
:global(.account-menu.p-menu) {
  box-sizing: content-box;
  min-width: 0;
  max-width: calc(100vw - var(--space-4));
  padding: var(--space-2);
  border-radius: var(--radius-md);
}

:global(.account-menu.p-menu .p-menu-item > .p-menu-item-content) {
  color: inherit;
  background: transparent !important;
  border-radius: var(--radius-full);
  overflow: visible;
}

:global(.account-menu .p-menu-list) {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
}

:global(.account-menu-link) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  width: 100%;
  min-height: 44px;
  padding: var(--space-2) var(--space-3);

  text-decoration: none;

  border-radius: var(--radius-full);
}

:global(.account-menu .account-menu-link:hover),
:global(.account-menu .account-menu-link:active),
:global(.mobile-navigation-menu .account-menu-link.is-active),
:global(.account-menu .p-menu-item[data-p-focused='true'] .account-menu-link) {
  color: var(--color-surface);
  background: linear-gradient(
    90deg,
    var(--color-secondary) 0%,
    var(--color-secondary-soft) 50%,
    var(--color-secondary) 100%
  );
  background-size: 220% 100%;
}

:global(.account-menu .account-menu-link:focus-visible),
:global(
  .account-menu:has(.p-menu-list:focus-visible)
    .p-menu-item[data-p-focused='true']
    .account-menu-link
) {
  outline: 3px solid var(--color-dark-light);
  outline-offset: var(--space-1);
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

/* 平板尺寸 */
@media (max-width: 1100px) {
  :deep(.main-menu .p-menubar-root-list),
  .header-actions {
    gap: var(--space-2);
  }

  .root-menu-link,
  .header-action-button {
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

  .root-menu-link,
  .header-action-button {
    --base-icon-action-expanded-width: 128px;
    --header-action-gap: var(--space-2);
  }

  :deep(.main-menu .p-menubar-root-list) {
    gap: var(--space-1);
  }

  .root-menu-link .menu-label-en,
  .header-action-button .menu-label-en {
    display: none;
  }
}

@media (max-width: 768px) {
  .logo-link {
    min-height: 44px;
  }

  .root-menu-link,
  .header-action-button {
    --base-icon-action-expanded-width: 116px;
    --header-action-gap: var(--space-1);
    --base-icon-action-size: 44px;
    padding-inline: var(--space-2);
  }

  .menu-label {
    letter-spacing: var(--letter-spacing-wide);
  }

  :global(.account-menu .account-menu-link) {
    gap: var(--space-1);
    padding-inline: var(--space-2);
  }
}

@media (max-width: 640px) {
  .root-menu-link {
    --header-action-gap: 0px;
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
    width: 44px;
    height: 44px;
    overflow: hidden;
  }

  .logo-image {
    max-width: none;
    height: 38px;
  }

  .root-menu-link,
  .header-action-button {
    --base-icon-action-size: 44px;
  }

  :deep(.main-menu .p-menubar-root-list),
  .header-actions {
    gap: var(--space-1);
  }
}

/* 窄版僅保留 Logo 與一顆共用 BaseIconAction 的導覽入口。 */
@media (max-width: 900px) {
  :deep(.main-menu.p-menubar) {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  :deep(.main-menu .p-menubar-root-list),
  .check-in-button,
  .avatar-button {
    display: none;
  }

  .header-action-button.mobile-menu-button {
    --base-icon-action-expanded-width: 140px;
    --header-action-gap: var(--space-2);
    display: inline-flex;
  }

  .mobile-menu-button .menu-label-en {
    display: block;
  }
}
</style>
