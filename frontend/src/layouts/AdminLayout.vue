<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <span class="admin-brand-title">跑者菲迪</span>
        <span class="admin-brand-subtitle">ADMIN</span>
      </div>

      <nav class="admin-navigation" aria-label="管理員後台導覽">
        <RouterLink to="/admin" class="admin-navigation-link">
          <LayoutDashboard class="admin-navigation-icon" aria-hidden="true" />
          <span>儀表板</span>
        </RouterLink>
      </nav>

      <RouterLink to="/home" class="back-to-site-link">
        <ArrowLeft class="back-to-site-icon" aria-hidden="true" />
        <span>返回前台</span>
      </RouterLink>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <div>
          <p class="admin-header-eyebrow">PHEIDI THE RUNNER</p>
          <h1 class="admin-header-title">管理員後台</h1>
        </div>
      </header>

      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, LayoutDashboard } from '@lucide/vue'
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);

  min-height: 100vh;

  color: var(--color-text);
  background: var(--color-background);
}

/* Sidebar */
.admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  padding: var(--space-4) var(--space-3);

  background: var(--color-dark);
}

.admin-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  padding-bottom: var(--space-3);

  color: white;
  border-bottom: 1px solid rgb(255 255 255 / 15%);
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

  color: rgb(255 255 255 / 75%);
  text-decoration: none;

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

.admin-navigation-icon,
.back-to-site-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.back-to-site-link {
  margin-top: auto;
}

/* Main */
.admin-main {
  min-width: 0;
}

.admin-header {
  display: flex;
  align-items: center;

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

@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    min-height: auto;
  }

  .back-to-site-link {
    margin-top: 0;
  }
}
</style>