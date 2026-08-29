<template>
  <div class="main-layout">
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

import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import ProgressionEventLayer from '@/components/progression/ProgressionEventLayer.vue'

const ProgressionPreviewControls = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/progression/ProgressionPreviewControls.vue'))
  : null
</script>
