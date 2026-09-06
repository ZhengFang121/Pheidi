<template>
  <div class="main-layout" :class="{ 'main-layout--home': route.name === 'home' }">
    <AppHeader />

    <main class="page-content">
      <router-view />
    </main>

    <div class="footer-transition" aria-hidden="true"></div>

    <AppFooter />

    <ProgressionEventLayer />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import ProgressionEventLayer from '@/components/progression/ProgressionEventLayer.vue'

const route = useRoute()
</script>

<style scoped>
.main-layout--home .page-content {
  margin-top: calc(-1 * var(--app-header-height));
}

.main-layout .page-content > :deep(*) {
  padding-bottom: 0;
}

.footer-transition {
  height: var(--space-7);
}

@media (max-width: 640px) {
  .footer-transition {
    height: var(--space-6);
  }
}
</style>
