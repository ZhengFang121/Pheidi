<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

interface Props {
  title?: string
  description: string
  as?: 'article' | 'section'
  size?: 'default' | 'wide'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  as: 'section',
  size: 'default',
})
</script>

<template>
  <main class="account-page">
    <BaseCard
      :as="props.as"
      variant="glass"
      class="account-card"
      :class="{ 'account-card--wide': props.size === 'wide' }"
    >
      <header class="account-card__header">
        <img src="/logo.svg" alt="跑者菲迪 Pheidi the Runner" class="account-card__logo" />

        <h1 v-if="props.title" class="account-card__title">{{ props.title }}</h1>

        <p class="account-card__description">{{ props.description }}</p>
      </header>

      <slot />
    </BaseCard>
  </main>
</template>

<style scoped>
.account-page {
  display: grid;
  min-height: 100vh;
  padding: var(--space-5);
  background-color: var(--color-primary-pale);
  place-items: center;
}

.account-card {
  --account-control-height: calc(var(--space-6) + var(--space-1));

  width: min(100%, 30rem);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  letter-spacing: var(--letter-spacing-base);
}

.account-card--wide {
  width: min(100%, 52rem);
}

.account-card__header {
  margin-bottom: var(--space-5);
  text-align: center;
}

.account-card__logo {
  display: block;
  width: min(100%, 12rem);
  height: auto;
  margin-inline: auto;
}

.account-card__title {
  margin: var(--space-3) 0 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-tight);
}

.account-card__description {
  margin: var(--space-3) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
}

.account-card__title + .account-card__description {
  margin-top: var(--space-2);
}

@media (max-width: 480px) {
  .account-page {
    padding: var(--space-4);
  }

  .account-card {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
  }

  .account-card__title {
    font-size: var(--font-size-base);
  }
}
</style>
