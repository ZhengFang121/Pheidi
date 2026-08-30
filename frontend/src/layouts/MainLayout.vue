<template>
  <div class="main-layout" :class="{ 'main-layout--home': route.name === 'home' }">
    <AppHeader />

    <main class="page-content">
      <router-view />
    </main>

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
</style>
