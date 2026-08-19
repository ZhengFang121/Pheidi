<template>
  <section class="dashboard-page">
    <div class="dashboard-heading">
      <p class="dashboard-eyebrow">DASHBOARD</p>
      <h2 class="dashboard-title">儀表板</h2>
      <p class="dashboard-description">
        歡迎回到跑者菲迪管理員後台。之後會在這裡顯示玩家、學院文章與廣場內容摘要。
      </p>
    </div>

    <div class="dashboard-placeholder">
      <LayoutDashboard class="dashboard-placeholder-icon" aria-hidden="true" />

      <div>
        <h3 class="dashboard-placeholder-title">後台架構已建立</h3>
        <p class="dashboard-placeholder-description">
          下一階段將逐步加入玩家管理、跑者學院管理與菲迪廣場管理。
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LayoutDashboard } from '@lucide/vue'
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dashboard-heading {
  max-width: 720px;
}

.dashboard-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wider);
}

.dashboard-title {
  margin: 0 0 var(--space-2);

  color: var(--color-text);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}

.dashboard-description {
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
}

.dashboard-placeholder {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  padding: var(--space-4);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.dashboard-placeholder-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;

  color: var(--color-primary);
}

.dashboard-placeholder-title {
  margin: 0 0 var(--space-1);

  color: var(--color-text);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
}

.dashboard-placeholder-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-body);
}
</style>