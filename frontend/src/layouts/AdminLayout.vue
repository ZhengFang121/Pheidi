<template>
  <div
    :class="[
      'admin-layout',
      {
        'is-sidebar-collapsed': isSidebarCollapsed,
      },
    ]"
  >
    <!-- 桌面版側邊欄 -->
    <aside id="admin-sidebar" class="admin-sidebar">
      <div class="admin-sidebar-header">
        <RouterLink
          to="/admin"
          class="admin-brand"
          aria-label="回到管理員首頁"
        >
          <img
            :src="isSidebarCollapsed ? '/logo-3.svg' : '/logo-2.svg'"
            alt="跑者菲迪"
            class="admin-brand-logo"
          />
        </RouterLink>

        <button
          type="button"
          class="sidebar-toggle-button"
          :aria-label="isSidebarCollapsed ? '展開側邊欄' : '收合側邊欄'"
          :aria-expanded="!isSidebarCollapsed"
          aria-controls="admin-sidebar"
          @click="toggleSidebar"
        >
          <PanelLeftOpen
            v-if="isSidebarCollapsed"
            class="sidebar-toggle-icon"
            aria-hidden="true"
          />

          <PanelLeftClose
            v-else
            class="sidebar-toggle-icon"
            aria-hidden="true"
          />
        </button>
      </div>

      <nav class="admin-navigation" aria-label="管理員後台導覽">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.route"
          :to="item.route"
          class="admin-navigation-link"
          :title="isSidebarCollapsed ? item.label : undefined"
        >
          <component
            :is="item.icon"
            class="admin-navigation-icon"
            aria-hidden="true"
          />

          <span class="admin-navigation-label">
            {{ item.label }}
          </span>
        </RouterLink>
      </nav>

      <RouterLink
        to="/home"
        class="back-to-site-link"
        :title="isSidebarCollapsed ? '回到網站' : undefined"
      >
        <ArrowLeft class="back-to-site-icon" aria-hidden="true" />

        <span class="back-to-site-label">回到網站</span>
      </RouterLink>
    </aside>

    <!-- 後台主要內容 -->
    <div class="admin-main">
      <header class="admin-header">
        <button
          type="button"
          class="mobile-menu-button"
          aria-label="開啟管理員選單"
          aria-controls="admin-mobile-sidebar"
          :aria-expanded="isMobileDrawerVisible"
          @click="isMobileDrawerVisible = true"
        >
          <Menu class="mobile-menu-icon" aria-hidden="true" />
        </button>

        <div>
          <p class="admin-header-eyebrow">PHEIDI THE RUNNER</p>
          <h1 class="admin-header-title">管理員後台</h1>
        </div>
      </header>

      <main class="admin-content">
        <RouterView />
      </main>
    </div>

    <!-- 手機／平板版 Drawer -->
    <Drawer
      id="admin-mobile-sidebar"
      v-model:visible="isMobileDrawerVisible"
      position="left"
      class="admin-mobile-drawer"
    >
      <template #header>
        <RouterLink
          to="/admin"
          class="mobile-drawer-brand"
          @click="closeMobileDrawer"
        >
          <img
            src="/logo-2.svg"
            alt="跑者菲迪"
            class="admin-brand-logo"
          />
        </RouterLink>
      </template>

      <nav class="mobile-navigation" aria-label="行動版管理員後台導覽">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.route"
          :to="item.route"
          class="mobile-navigation-link"
          @click="closeMobileDrawer"
        >
          <component
            :is="item.icon"
            class="mobile-navigation-icon"
            aria-hidden="true"
          />

          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <template #footer>
        <RouterLink
          to="/home"
          class="mobile-back-to-site-link"
          @click="closeMobileDrawer"
        >
          <ArrowLeft class="mobile-navigation-icon" aria-hidden="true" />
          <span>回到網站</span>
        </RouterLink>
      </template>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import {
  ArrowLeft,
  Files,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
} from '@lucide/vue'
import Drawer from 'primevue/drawer'

interface AdminNavigationItem {
  label: string
  route: string
  icon: Component
}

const sidebarStorageKey = 'pheidi_admin_sidebar_collapsed'

const navigationItems: AdminNavigationItem[] = [
  {
    label: '首頁',
    route: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: '玩家管理',
    route: '/admin/users',
    icon: UsersRound,
  },
  {
    label: '文章管理',
    route: '/admin/articles',
    icon: Files,
  },
  {
    label: '廣場管理',
    route: '/admin/plaza',
    icon: MessageSquareText,
  },
]

const isSidebarCollapsed = ref(
  localStorage.getItem(sidebarStorageKey) === 'true',
)

const isMobileDrawerVisible = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value

  localStorage.setItem(
    sidebarStorageKey,
    String(isSidebarCollapsed.value),
  )
}

const closeMobileDrawer = () => {
  isMobileDrawerVisible.value = false
}
</script>

<style scoped>
.admin-layout {
  --admin-sidebar-width: 185px;
  --admin-sidebar-collapsed-width: 72px;
  --admin-sidebar-brand-height: 232px;

  display: grid;
  grid-template-columns: var(--admin-sidebar-width) minmax(0, 1fr);

  min-height: 100vh;

  color: var(--color-text);
  background: var(--color-background);

  transition: grid-template-columns 0.25s ease;
}

.admin-layout.is-sidebar-collapsed {
  grid-template-columns:
    var(--admin-sidebar-collapsed-width)
    minmax(0, 1fr);
}

/* Desktop sidebar */
.admin-sidebar {
  position: sticky;
  top: 0;

  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  height: 100vh;

  overflow: hidden;

  background: var(--color-primary-pale);
}

.admin-sidebar-header {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 var(--admin-sidebar-brand-height);
  min-height: var(--admin-sidebar-brand-height);
  padding: var(--space-2) var(--space-3);

  border-bottom: 1px solid var(--color-primary-soft);
}

.admin-brand,
.mobile-drawer-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-primary);
  text-decoration: none;
}

.admin-brand {
  justify-content: center;
  width: 100%;
}

.admin-brand-logo {
  display: block;
  width: 112px;
  height: auto;
}

.admin-brand-mark {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  color: var(--color-dark);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);

  background: var(--color-primary);
  border-radius: var(--radius-md);
}

.admin-brand-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;

  white-space: nowrap;

  opacity: 1;

  transition:
    opacity 0.15s ease,
    visibility 0.15s ease;
}

.admin-brand-title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-normal);
}

.admin-brand-subtitle {
  font-size: var(--font-size-caption);
  letter-spacing: var(--letter-spacing-wider);
  opacity: 0.7;
}

.sidebar-toggle-button,
.mobile-menu-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;
  padding: 0;

  color: var(--color-primary);

  cursor: pointer;

  background: transparent;
  border: 0;
  border-radius: var(--radius-md);

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.sidebar-toggle-button {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);

  width: 32px;
  height: 32px;
}

.sidebar-toggle-button:hover,
.sidebar-toggle-button:focus-visible {
  color: var(--color-surface);
  background: var(--color-primary-light);
}

.sidebar-toggle-button:focus-visible,
.mobile-menu-button:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 2px;
}

.sidebar-toggle-icon,
.mobile-menu-icon {
  width: 22px;
  height: 22px;
}

/* Navigation */
.admin-navigation {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* 展開狀態：統一四個選單的左右外距 */
.admin-layout:not(.is-sidebar-collapsed) .admin-navigation {
  margin-inline: var(--space-4);
}

.admin-layout:not(.is-sidebar-collapsed) .back-to-site-link {
  margin-right: var(--space-4);
  margin-left: var(--space-4);
}

.admin-navigation-link,
.back-to-site-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  min-height: 48px;

  overflow: hidden;

  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;

  border-radius: var(--radius-md);

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.admin-layout:not(.is-sidebar-collapsed) .admin-navigation-link,
.admin-layout:not(.is-sidebar-collapsed) .back-to-site-link {
  padding-left: var(--space-5);
}

.admin-navigation-link:hover,
.admin-navigation-link.router-link-exact-active,
.back-to-site-link:hover {
  color: var(--color-surface);
  background: var(--color-primary-light);
}

.admin-navigation-link:focus-visible,
.back-to-site-link:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 2px;
}

.admin-navigation-icon,
.back-to-site-icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
}

.admin-navigation-label,
.back-to-site-label {
  opacity: 1;

  transition:
    opacity 0.15s ease,
    visibility 0.15s ease;
}

.back-to-site-link {
  margin: auto var(--space-2) var(--space-3);
}

/* Collapsed state */
.is-sidebar-collapsed .admin-sidebar {
  align-items: center;
}

.is-sidebar-collapsed .admin-sidebar-header {
  width: 100%;
  flex-basis: 100px;
  min-height: 100px;
  padding: var(--space-3) var(--space-1) var(--space-1);
}

.is-sidebar-collapsed .sidebar-toggle-button {
  top: calc(100% + var(--space-5));
  right: auto;
  left: 50%;

  width: calc(100% - var(--space-2) * 2);
  height: 48px;
  padding: var(--space-2);

  transform: translateX(-50%);
}

.is-sidebar-collapsed .sidebar-toggle-icon {
  width: 20px;
  height: 20px;
}

.is-sidebar-collapsed .admin-brand-text,
.is-sidebar-collapsed .admin-navigation-label,
.is-sidebar-collapsed .back-to-site-label {
  position: absolute;

  visibility: hidden;
  opacity: 0;
}

.is-sidebar-collapsed .admin-brand-logo {
  width: 40px;
}

.is-sidebar-collapsed .admin-navigation,
.is-sidebar-collapsed .back-to-site-link {
  width: calc(100% - var(--space-2) * 2);
}

.is-sidebar-collapsed .admin-navigation {
  margin-top: var(--space-8);
}

.is-sidebar-collapsed .admin-navigation-link {
  width: 100%;
}

.is-sidebar-collapsed .admin-navigation-link,
.is-sidebar-collapsed .back-to-site-link {
  justify-content: center;
}

/* Main */
.admin-main {
  min-width: 0;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  min-height: 100px;
  padding: var(--space-3) var(--space-6);

  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.admin-header-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-caption);
  letter-spacing: var(--letter-spacing-wider);
}

.admin-header-title {
  margin: 0;

  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}

.admin-content {
  padding: var(--space-5) var(--space-6);
}

.mobile-menu-button {
  display: none;

  color: var(--color-dark);
}

.mobile-menu-button:hover {
  color: white;
  background: var(--color-primary);
}

/* Mobile Drawer */
.mobile-navigation {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mobile-navigation-link,
.mobile-back-to-site-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  min-height: 48px;
  padding: var(--space-2);

  color: var(--color-text);
  text-decoration: none;

  border-radius: var(--radius-md);

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.mobile-navigation-link:hover,
.mobile-navigation-link.router-link-exact-active,
.mobile-back-to-site-link:hover {
  color: var(--color-primary);
  background: var(--color-primary-pale);
}

.mobile-navigation-link:focus-visible,
.mobile-back-to-site-link:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 2px;
}

.mobile-navigation-icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
}

.mobile-back-to-site-link {
  width: 100%;
}

:global(.admin-mobile-drawer.p-drawer) {
  width: min(320px, calc(100vw - 32px));
}

:global(.admin-mobile-drawer .p-drawer-header) {
  color: var(--color-primary);
  background: var(--color-primary-pale);
}

:global(.admin-mobile-drawer .p-drawer-close-button) {
  color: var(--color-primary);
}

:global(.admin-mobile-drawer .p-drawer-content) {
  padding-top: var(--space-3);
}

:global(.admin-mobile-drawer .p-drawer-footer) {
  border-top: 1px solid var(--color-border);
}

/* Tablet and mobile */
@media (max-width: 1023px) {
  .admin-layout,
  .admin-layout.is-sidebar-collapsed {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-sidebar {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  .admin-header {
    min-height: 80px;
    padding: var(--space-2) var(--space-3);
  }

  .admin-header-eyebrow {
    display: none;
  }

  .admin-header-title {
    font-size: var(--font-size-h3);
  }

  .admin-content {
    padding: var(--space-3);
  }
}
</style>
