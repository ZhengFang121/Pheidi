<template>
  <div class="main-layout" :class="{ 'main-layout--home': route.name === 'home' }">
    <AppHeader />

    <main class="page-content">
      <router-view />
    </main>

    <div v-if="route.name !== 'home'" class="footer-transition" aria-hidden="true"></div>

    <AppFooter />

    <ProgressionEventLayer />
    <component :is="ProgressionPreviewControls" v-if="ProgressionPreviewControls" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import ProgressionEventLayer from '@/components/progression/ProgressionEventLayer.vue'

const route = useRoute()

const ProgressionPreviewControls = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/progression/ProgressionPreviewControls.vue'))
  : null
</script>

<style scoped>
.main-layout--home .page-content {
  margin-top: calc(-1 * var(--app-header-height));
}

.footer-transition {
  height: clamp(var(--space-8), 10vw, calc(var(--space-8) + var(--space-8)));
  background: linear-gradient(
    180deg,
    var(--color-background) 0%,
    var(--color-secondary-pale) 52%,
    var(--color-secondary-soft) 100%
  );
}
</style>
