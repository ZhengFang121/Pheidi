<script setup lang="ts">
import type { WeatherIconVariant } from '@/types/weatherIcon'

interface Props {
  variant: WeatherIconVariant
  size?: number | string
  strokeWidth?: number | string
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 24,
  strokeWidth: 2,
  active: true,
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="['animated-weather-icon', `animated-weather-icon--${variant}`, { 'is-active': active }]"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
  >
    <template v-if="variant === 'cloud-hail' || variant === 'cloud-snow'">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />

      <g class="animated-weather-icon__precipitation">
        <template v-if="variant === 'cloud-hail'">
          <path d="M8 14v2" />
          <path d="M12 22h.01" />
          <path d="M16 14v2" />
          <path d="M12 16v2" />
          <path d="M16 20h.01" />
          <path d="M8 20h.01" />
        </template>

        <template v-else>
          <path d="M8 15h.01" />
          <path d="M12 21h.01" />
          <path d="M16 15h.01" />
          <path d="M12 17h.01" />
          <path d="M16 19h.01" />
          <path d="M8 19h.01" />
        </template>
      </g>
    </template>

    <template v-else-if="variant === 'cloud-sun' || variant === 'cloud-sun-rain'">
      <path
        v-if="variant === 'cloud-sun'"
        class="animated-weather-icon__cloud"
        d="M13,22h-6c-2.8,0-5-2.2-5-5,0-2.8,2.2-5,5-5,2.4,0,4.4,1.7,4.9,4h1.1c1.7,0,3,1.3,3,3s-1.3,3-3,3Z"
      />
      <path v-else d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" />

      <path
        :d="
          variant === 'cloud-sun'
            ? 'M15.9,12.6c.4-2.2-1.1-4.2-3.3-4.6-.9-.1-1.8,0-2.6.5'
            : 'M15.947 12.65a4 4 0 0 0-5.925-4.128'
        "
      />

      <g v-if="variant === 'cloud-sun-rain'" class="animated-weather-icon__rain">
        <path d="M7 19v2" />
        <path d="M11 20v2" />
      </g>

      <g class="animated-weather-icon__rays">
        <line x1="6.3" y1="6.3" x2="4.9" y2="4.9" />
        <line x1="12" y1="4" x2="12" y2="2" />
        <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </g>
    </template>

    <template v-else>
      <circle cx="12" cy="12" r="4" />

      <g class="animated-weather-icon__rays">
        <line x1="12" y1="4" x2="12" y2="3" />
        <line x1="17.7" y1="6.3" x2="18.4" y2="5.6" />
        <line x1="20" y1="12" x2="21" y2="12" />
        <line x1="17.7" y1="17.7" x2="18.4" y2="18.4" />
        <line x1="12" y1="20" x2="12" y2="21" />
        <line x1="6.3" y1="17.7" x2="5.6" y2="18.4" />
        <line x1="4" y1="12" x2="3" y2="12" />
        <line x1="6.3" y1="6.3" x2="5.6" y2="5.6" />
      </g>
    </template>
  </svg>
</template>

<style scoped>
.animated-weather-icon.is-active .animated-weather-icon__cloud {
  animation: cloud-drift 2.8s ease-in-out infinite;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line {
  stroke-dasharray: 3;
  animation: ray-draw 2.4s ease-in-out infinite;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(2) {
  animation-delay: 0.07s;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(3) {
  animation-delay: 0.14s;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(4) {
  animation-delay: 0.21s;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(5) {
  animation-delay: 0.28s;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(6) {
  animation-delay: 0.35s;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(7) {
  animation-delay: 0.42s;
}

.animated-weather-icon.is-active .animated-weather-icon__rays line:nth-child(8) {
  animation-delay: 0.49s;
}

.animated-weather-icon.is-active .animated-weather-icon__precipitation path {
  animation: precipitation-pulse 1.2s ease-in-out infinite;
}

.animated-weather-icon.is-active .animated-weather-icon__precipitation path:nth-child(2) {
  animation-delay: 0.2s;
}

.animated-weather-icon.is-active .animated-weather-icon__precipitation path:nth-child(3) {
  animation-delay: 0.4s;
}

.animated-weather-icon.is-active .animated-weather-icon__precipitation path:nth-child(4) {
  animation-delay: 0.6s;
}

.animated-weather-icon.is-active .animated-weather-icon__precipitation path:nth-child(5) {
  animation-delay: 0.8s;
}

.animated-weather-icon.is-active .animated-weather-icon__precipitation path:nth-child(6) {
  animation-delay: 1s;
}

.animated-weather-icon.is-active .animated-weather-icon__rain path {
  animation: precipitation-pulse 0.8s ease-in-out infinite;
}

.animated-weather-icon.is-active .animated-weather-icon__rain path:nth-child(2) {
  animation-delay: 0.3s;
}

@keyframes cloud-drift {
  0%,
  100% {
    transform: translate(0);
  }

  33% {
    transform: translate(-1px, -1px);
  }

  66% {
    transform: translate(1px, 1px);
  }
}

@keyframes ray-draw {
  0%,
  100% {
    opacity: 0.4;
    stroke-dashoffset: 3;
  }

  45%,
  65% {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

@keyframes precipitation-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animated-weather-icon.is-active .animated-weather-icon__cloud,
  .animated-weather-icon.is-active .animated-weather-icon__rays line,
  .animated-weather-icon.is-active .animated-weather-icon__precipitation path,
  .animated-weather-icon.is-active .animated-weather-icon__rain path {
    animation: none;
  }
}
</style>
