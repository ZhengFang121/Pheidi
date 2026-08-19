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
          :aria-label="isSidebarCollapsed ? '回到管理員儀表板' : undefined"
        >
          <span class="admin-brand-mark">P</span>

          <span class="admin-brand-text">
            <span class="admin-brand-title">跑者菲迪</span>
            <span class="admin-brand-subtitle">ADMIN</span>
          </span>
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
        :title="isSidebarCollapsed ? '返回前台' : undefined"
      >
        <ArrowLeft class="back-to-site-icon" aria-hidden="true" />

        <span class="back-to-site-label">返回前台</span>
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
          <span class="admin-brand-mark">P</span>

          <span class="admin-brand-text">
            <span class="admin-brand-title">跑者菲迪</span>
            <span class="admin-brand-subtitle">ADMIN</span>
          </span>
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
          <span>返回前台</span>
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
  LayoutDashboard,
  Menu,
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
    label: '儀表板',
    route: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: '玩家管理',
    route: '/admin/users',
    icon: UsersRound,
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
  --admin-sidebar-width: 240px;
  --admin-sidebar-collapsed-width: 80px;

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
  padding: var(--space-3);

  overflow: hidden;

  background: var(--color-dark);
}

.admin-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1);

  min-height: 48px;
  padding-bottom: var(--space-3);

  border-bottom: 1px solid rgb(255 255 255 / 15%);
}

.admin-brand,
.mobile-drawer-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--space-2);

  color: white;
  text-decoration: none;
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

  color: white;

  cursor: pointer;

  background: transparent;
  border: 0;
  border-radius: var(--radius-md);

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.sidebar-toggle-button:hover,
.sidebar-toggle-button:focus-visible {
  color: var(--color-dark);
  background: var(--color-primary);
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

.admin-navigation-link,
.back-to-site-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  min-height: 48px;
  padding: var(--space-2);

  overflow: hidden;

  color: rgb(255 255 255 / 75%);
  text-decoration: none;
  white-space: nowrap;

  border-radius: var(--radius-md);

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.admin-navigation-link:hover,
.admin-navigation-link.router-link-exact-active,
.back-to-site-link:hover {
  color: white;
  background: rgb(255 255 255 / 12%);
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
  margin-top: auto;
}

/* Collapsed state */
.is-sidebar-collapsed .admin-sidebar {
  align-items: center;
  padding-inline: var(--space-2);
}

.is-sidebar-collapsed .admin-sidebar-header {
  flex-direction: column;
  padding-bottom: var(--space-2);
}

.is-sidebar-collapsed .admin-brand-text,
.is-sidebar-collapsed .admin-navigation-label,
.is-sidebar-collapsed .back-to-site-label {
  position: absolute;

  visibility: hidden;
  opacity: 0;
}

.is-sidebar-collapsed .admin-navigation,
.is-sidebar-collapsed .admin-navigation-link,
.is-sidebar-collapsed .back-to-site-link {
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
  padding: var(--space-3) var(--space-4);

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
  padding: var(--space-4);
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
  color: white;
  background: var(--color-dark);
}

:global(.admin-mobile-drawer .p-drawer-close-button) {
  color: white;
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