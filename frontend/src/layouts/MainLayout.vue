<template>
  <div class="main-layout">
    <AppHeader />

    <main class="page-content">
      <router-view />
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>
