<script setup lang="ts">
import { Cloudy, Snowflake, Sun, SunMedium, ThermometerSun, Wind } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, type Component } from 'vue'

import Cloudscape from '@/components/home/Cloudscape.vue'
import WeatherExpansionHero from '@/components/home/WeatherExpansionHero.vue'
import RunnerProgressCard from '@/components/progress/RunnerProgressCard.vue'
import { useRunnerProgress } from '@/composables/useRunnerProgress'
import { getLocationLabel } from '@/services/geocoding'
import {
  getCurrentWeather,
  getWeatherForecast,
  type CurrentWeather,
  type WeatherForecast,
} from '@/services/weather'
import type { WeatherIconVariant } from '@/types/weatherIcon'
import { getCurrentCoordinates } from '@/utils/geolocation'
import { useAuthStore } from '@/stores/auth'

const weather = ref<CurrentWeather | null>(null)
const isWeatherLoading = ref(true)
const weatherError = ref('')
const forecast = ref<WeatherForecast | null>(null)
const forecastError = ref('')
let weatherRefreshTimer: number | undefined
let lastWeatherDate = ''
let isDisposed = false

function getWeatherDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: forecast.value?.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function refreshWeatherOnDateChange() {
  if (!document.hidden && !isWeatherLoading.value && getWeatherDate() !== lastWeatherDate) {
    void loadWeather()
  }
}
const locationLabel = ref('位置解析中...')
const authStore = useAuthStore()
const { runnerProgress, isRunnerProgressLoading, runnerProgressError, loadRunnerProgress } =
  useRunnerProgress()
const username = computed(() => authStore.user?.username ?? '')

interface WeatherPresentation {
  title: string
  mainIcon: WeatherIconVariant
  accentIcon: Component
  tone: string
}

const weatherPresentation = computed<WeatherPresentation>(() => {
  if (isWeatherLoading.value) {
    return {
      title: '正在確認今天的跑步天氣',
      mainIcon: 'cloud-sun',
      accentIcon: Sun,
      tone: 'mild',
    }
  }

  if (!weather.value) {
    return {
      title: '今天的跑步天氣',
      mainIcon: 'cloud-sun',
      accentIcon: Wind,
      tone: 'mild',
    }
  }

  const { temperature, precipitationProbability } = weather.value

  if (precipitationProbability >= 70) {
    return {
      title: '降雨偏高今天改做室內訓練',
      mainIcon: 'cloud-hail',
      accentIcon: Cloudy,
      tone: 'rain',
    }
  }

  if (precipitationProbability >= 40) {
    return {
      title: '可能下雨今天適合短程慢跑',
      mainIcon: 'cloud-sun-rain',
      accentIcon: Cloudy,
      tone: 'rain',
    }
  }

  if (temperature >= 35) {
    return {
      title: '天氣炎熱今天先別急著出發',
      mainIcon: 'sun-medium',
      accentIcon: SunMedium,
      tone: 'hot',
    }
  }

  if (temperature >= 30) {
    return {
      title: '氣溫偏高今天適合晚點再跑',
      mainIcon: 'sun-medium',
      accentIcon: ThermometerSun,
      tone: 'hot',
    }
  }

  if (temperature <= 10) {
    return {
      title: '氣溫偏低請暖身後再出發吧',
      mainIcon: 'cloud-snow',
      accentIcon: Snowflake,
      tone: 'cold',
    }
  }

  if (precipitationProbability >= 20) {
    return {
      title: '有短暫雨今天適合輕鬆短跑',
      mainIcon: 'cloud-sun-rain',
      accentIcon: Sun,
      tone: 'mild',
    }
  }

  if (temperature >= 18 && temperature <= 27) {
    return {
      title: '天氣舒適今天適合自在開跑',
      mainIcon: 'cloud-sun',
      accentIcon: Sun,
      tone: 'mild',
    }
  }

  return {
    title: '今天適合輕鬆跑步',
    mainIcon: 'cloud-sun',
    accentIcon: Wind,
    tone: 'mild',
  }
})

async function loadWeather() {
  if (isDisposed) return
  isWeatherLoading.value = true
  weatherError.value = ''
  forecastError.value = ''
  weather.value = null
  forecast.value = null
  lastWeatherDate = getWeatherDate()

  try {
    const coordinates = await getCurrentCoordinates()
    const [currentResult, forecastResult, currentLocationLabel] = await Promise.all([
      getCurrentWeather(coordinates.latitude, coordinates.longitude)
        .then((value) => ({ value, error: false as const }))
        .catch(() => ({ value: null, error: true as const })),
      getWeatherForecast(coordinates.latitude, coordinates.longitude)
        .then((value) => ({ value, error: false as const }))
        .catch(() => ({ value: null, error: true as const })),
      getLocationLabel(coordinates.latitude, coordinates.longitude).catch(() => '位置無法辨識'),
    ])

    if (isDisposed) return
    weather.value = currentResult.value
    forecast.value = forecastResult.value
    weatherError.value = currentResult.error ? '目前無法取得今日天氣' : ''
    forecastError.value = forecastResult.error ? '目前無法取得未來四天天氣預報' : ''
    locationLabel.value = currentLocationLabel
    // API 的第一天就是所在地的今天，跨日仍以同一時區檢查。
    lastWeatherDate = forecastResult.value?.days[0]?.date ?? getWeatherDate()
  } catch (error) {
    if (isDisposed) return
    console.error('取得天氣資料失敗：', error)
    weatherError.value = '目前無法取得天氣資料'
    forecastError.value = '目前無法取得未來四天天氣預報'
    locationLabel.value = '位置無法辨識'
  } finally {
    if (!isDisposed) isWeatherLoading.value = false
  }
}

onMounted(() => {
  void loadWeather()
  void loadRunnerProgress()
  weatherRefreshTimer = window.setInterval(refreshWeatherOnDateChange, 60_000)
  document.addEventListener('visibilitychange', refreshWeatherOnDateChange)
})

onUnmounted(() => {
  isDisposed = true
  window.clearInterval(weatherRefreshTimer)
  document.removeEventListener('visibilitychange', refreshWeatherOnDateChange)
})
</script>

<template>
  <main class="home-page">
    <Cloudscape class="home-page__background" />

    <WeatherExpansionHero
      class="home-page__hero"
      :title="weatherPresentation.title"
      :tone="weatherPresentation.tone"
      :main-icon="weatherPresentation.mainIcon"
      :accent-icon="weatherPresentation.accentIcon"
      :weather="weather"
      :forecast="forecast"
      :forecast-error="forecastError"
      :is-loading="isWeatherLoading"
      :error="weatherError"
      :location-label="locationLabel"
    />

    <div class="home-progress layout-container">
      <RunnerProgressCard
        :progress="runnerProgress"
        :username="username"
        :loading="isRunnerProgressLoading"
        :error="runnerProgressError"
        @retry="loadRunnerProgress"
      />
    </div>
  </main>
</template>

<style scoped>
.home-page {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  background: transparent;
}

.home-page > .home-page__background {
  position: fixed;
  z-index: 0;
  pointer-events: none;
}

.home-page__hero,
.home-progress {
  position: relative;
  z-index: 1;
}

/* 日報與旅程卡片共用水平內距，垂直內距維持各元件原有設定。 */
.home-page :deep(.weather-newspaper),
.home-page :deep(.journey-card) {
  padding-inline: calc(var(--space-6) * 1.5);
}

.home-progress {
  padding: var(--space-7) 0 calc(var(--space-8) + var(--space-8));
}

@media (max-width: 600px) {
  .home-page :deep(.weather-newspaper),
  .home-page :deep(.journey-card) {
    padding-inline: calc(var(--space-4) * 1.5);
  }

  .home-progress {
    padding: var(--space-5) 0 calc(var(--space-5) + var(--space-4));
  }
}
</style>
