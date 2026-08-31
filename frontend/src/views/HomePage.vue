<script setup lang="ts">
import { Cloudy, Snowflake, Sun, SunMedium, ThermometerSun, Wind } from '@lucide/vue'
import { computed, onMounted, ref, type Component } from 'vue'

import WeatherExpansionHero from '@/components/home/WeatherExpansionHero.vue'
import RunnerProgressCard from '@/components/progress/RunnerProgressCard.vue'
import { useRunnerProgress } from '@/composables/useRunnerProgress'
import { getLocationLabel } from '@/services/geocoding'
import { getCurrentWeather, type CurrentWeather } from '@/services/weather'
import type { WeatherIconVariant } from '@/types/weatherIcon'
import { getCurrentCoordinates } from '@/utils/geolocation'
import { useAuthStore } from '@/stores/auth'

const weather = ref<CurrentWeather | null>(null)
const isWeatherLoading = ref(true)
const weatherError = ref('')
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
      title: '降雨偏高，今天改做室內訓練',
      mainIcon: 'cloud-hail',
      accentIcon: Cloudy,
      tone: 'rain',
    }
  }

  if (precipitationProbability >= 40) {
    return {
      title: '可能下雨，今天適合短程慢跑',
      mainIcon: 'cloud-sun-rain',
      accentIcon: Cloudy,
      tone: 'rain',
    }
  }

  if (temperature >= 35) {
    return {
      title: '天氣炎熱，今天先別急著出發',
      mainIcon: 'sun-medium',
      accentIcon: SunMedium,
      tone: 'hot',
    }
  }

  if (temperature >= 30) {
    return {
      title: '氣溫偏高，今天適合晚點再跑',
      mainIcon: 'sun-medium',
      accentIcon: ThermometerSun,
      tone: 'hot',
    }
  }

  if (temperature <= 10) {
    return {
      title: '氣溫偏低，暖身後再出發',
      mainIcon: 'cloud-snow',
      accentIcon: Snowflake,
      tone: 'cold',
    }
  }

  if (precipitationProbability >= 20) {
    return {
      title: '偶有短暫雨，今天適合輕鬆短跑',
      mainIcon: 'cloud-sun-rain',
      accentIcon: Sun,
      tone: 'mild',
    }
  }

  if (temperature >= 18 && temperature <= 27) {
    return {
      title: '天氣舒適，今天適合自在開跑',
      mainIcon: 'cloud-sun',
      accentIcon: Sun,
      tone: 'mild',
    }
  }

  return {
    title: '今天適合輕鬆跑',
    mainIcon: 'cloud-sun',
    accentIcon: Wind,
    tone: 'mild',
  }
})

async function loadWeather() {
  isWeatherLoading.value = true
  weatherError.value = ''

  try {
    const coordinates = await getCurrentCoordinates()

    const [currentWeather, currentLocationLabel] = await Promise.all([
      getCurrentWeather(coordinates.latitude, coordinates.longitude),
      getLocationLabel(coordinates.latitude, coordinates.longitude).catch((error: unknown) => {
        console.error('取得所在地區失敗：', error)
        return '位置無法辨識'
      }),
    ])

    weather.value = currentWeather
    locationLabel.value = currentLocationLabel
  } catch (error) {
    console.error('取得天氣資料失敗：', error)
    weatherError.value = '目前無法取得天氣資料'
  } finally {
    isWeatherLoading.value = false
  }
}

onMounted(() => {
  void loadWeather()
  void loadRunnerProgress()
})
</script>

<template>
  <main class="home-page">
    <WeatherExpansionHero
      :title="weatherPresentation.title"
      :tone="weatherPresentation.tone"
      :main-icon="weatherPresentation.mainIcon"
      :accent-icon="weatherPresentation.accentIcon"
      :weather="weather"
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
  min-height: 100%;
  background: linear-gradient(
    180deg,
    var(--color-primary-pale) 0%,
    color-mix(in srgb, var(--color-background) 48%, var(--color-primary-pale)) 100dvh,
    var(--color-primary-pale) calc(22% + 78dvh),
    color-mix(in srgb, var(--color-primary-pale) 50%, var(--color-secondary-pale))
      calc(44% + 56dvh),
    var(--color-secondary-pale) calc(68% + 32dvh),
    var(--color-secondary-soft) 100%
  );
}

.home-progress {
  padding: var(--space-7) 0 calc(var(--space-8) + var(--space-8));
}

@media (max-width: 600px) {
  .home-progress {
    padding: var(--space-5) 0 calc(var(--space-5) + var(--space-4));
  }
}
</style>
