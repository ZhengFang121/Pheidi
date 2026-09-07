<script setup lang="ts">
import { CloudRain, MapPin, Wind } from '@lucide/vue'
import gsap from 'gsap'
import type { Component } from 'vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import AnimatedWeatherIcon from '@/components/icons/AnimatedWeatherIcon.vue'
import type { CurrentWeather, WeatherForecast } from '@/services/weather'
import type { WeatherIconVariant } from '@/types/weatherIcon'

interface Props {
  title: string
  tone: string
  mainIcon: WeatherIconVariant
  accentIcon: Component
  weather: CurrentWeather | null
  forecast: WeatherForecast | null
  forecastError: string
  isLoading: boolean
  error: string
  locationLabel: string
}

const props = defineProps<Props>()
const upcomingForecast = computed(() => props.forecast?.days.slice(1, 5) ?? [])

const section = ref<HTMLElement | null>(null)
const media = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const dailyPanel = ref<HTMLElement | null>(null)
const dailySlot = ref<HTMLElement | null>(null)
const newspaper = ref<HTMLElement | null>(null)
const topRule = ref<HTMLElement | null>(null)
const bottomRule = ref<HTMLElement | null>(null)
const isExpanded = ref(false)
const isInteracting = ref(true)
const isWeatherIconActive = ref(true)
const reducedMotion = ref(false)
const todayDisplay = ref('')
const todayDateTime = ref('')

const progressProxy = { value: 0 }
const CONTENT_REVEAL_START = 0.18
const CONTENT_REVEAL_END = 0.74
let targetProgress = 0
let touchY: number | null = null
let progressTo: ((value: number) => void) | null = null
let resizeObserver: ResizeObserver | null = null
let iconObserver: IntersectionObserver | null = null
let motionPreference: MediaQueryList | null = null
let gsapContext: gsap.Context | null = null
let dateUpdateTimer: number | undefined
let layoutGeometry = {
  insetX: 0,
  insetY: 0,
  dailyX: 0,
  dailyY: 0,
  initialScale: 1,
  finalScale: 1,
  revealY: 0,
  ruleScale: 1,
}

// Grid 決定展開終點；只在尺寸改變時量測，避免每個動畫影格反覆讀取版面。
function measureLayout() {
  if (
    !media.value ||
    !dailySlot.value ||
    !dailyPanel.value ||
    !content.value ||
    !newspaper.value ||
    !topRule.value ||
    !bottomRule.value
  )
    return

  const bounds = media.value.getBoundingClientRect()
  const slot = dailySlot.value.getBoundingClientRect()
  const paperStyles = getComputedStyle(newspaper.value)
  const isMobile = window.matchMedia('(max-width: 720px)').matches
  const initialWidth = Math.min(isMobile ? 300 : 420, media.value.clientWidth)
  const initialHeight = Math.min(isMobile ? 480 : 700, media.value.clientHeight)
  const inset = parseFloat(paperStyles.paddingLeft)
  const ruleGap = parseFloat(paperStyles.rowGap)
  const ruleHeight = topRule.value.offsetHeight
  const panelWidth = dailyPanel.value.offsetWidth
  const panelHeight = dailyPanel.value.offsetHeight
  const insetX = (bounds.width - initialWidth) / 2
  const insetY = (bounds.height - initialHeight) / 2
  const initialBodyWidth = Math.max(0, initialWidth - 2 * inset)
  const initialBodyHeight = Math.max(0, initialHeight - 2 * (inset + ruleHeight + ruleGap))
  const initialScale = Math.min(initialBodyWidth / panelWidth, initialBodyHeight / panelHeight)
  const finalScale = Math.min(slot.width / panelWidth, slot.height / panelHeight)
  const slotCenterX = slot.left - bounds.left + slot.width / 2
  const slotCenterY = slot.top - bounds.top + media.value.scrollTop + slot.height / 2
  layoutGeometry = {
    insetX,
    insetY,
    dailyX: bounds.width / 2 - slotCenterX,
    dailyY: bounds.height / 2 - slotCenterY,
    initialScale,
    finalScale,
    revealY: parseFloat(getComputedStyle(content.value).rowGap),
    ruleScale: (panelWidth * initialScale) / topRule.value.offsetWidth,
  }
  renderProgress()
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum)
}

function updateToday() {
  const now = new Date()
  const date = props.forecast
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: props.forecast.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now)
    : ''
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  todayDateTime.value = date || `${year}-${month}-${day}`
  todayDisplay.value = todayDateTime.value.replaceAll('-', '.')
}

watch(() => props.forecast?.timezone, updateToday)

function renderProgress() {
  if (!media.value || !content.value || !dailyPanel.value || !topRule.value || !bottomRule.value)
    return

  const progress = reducedMotion.value ? 1 : clamp(progressProxy.value)
  const remaining = 1 - progress
  const geometry = layoutGeometry
  const contentProgress = clamp(
    (progress - CONTENT_REVEAL_START) / (CONTENT_REVEAL_END - CONTENT_REVEAL_START),
  )

  gsap.set(media.value, {
    clipPath: `inset(${geometry.insetY * remaining}px ${geometry.insetX * remaining}px round var(--radius-xl))`,
  })
  gsap.set(content.value, {
    autoAlpha: contentProgress,
    y: (1 - contentProgress) * geometry.revealY,
  })
  gsap.set(dailyPanel.value, {
    x: geometry.dailyX * remaining,
    y: geometry.dailyY * remaining,
    scale: geometry.initialScale + (geometry.finalScale - geometry.initialScale) * progress,
  })

  gsap.set([topRule.value, bottomRule.value], {
    // 雙線共用 Grid 的垂直位置，僅保留水平展開。
    y: 0,
    scaleX: geometry.ruleScale + (1 - geometry.ruleScale) * progress,
  })

  const nextExpanded = progress >= 0.999
  const nextInteracting = !reducedMotion.value && progress < 0.999

  if (isExpanded.value !== nextExpanded) isExpanded.value = nextExpanded
  if (isInteracting.value !== nextInteracting) isInteracting.value = nextInteracting
}

function updateProgress(delta: number) {
  targetProgress = clamp(targetProgress + delta)
  progressTo?.(targetProgress)
}

function isHeroAtPageStart() {
  if (!section.value) return false

  const bounds = section.value.getBoundingClientRect()
  return (
    (media.value?.scrollTop ?? 0) <= 0 &&
    window.scrollY <= 4 &&
    bounds.top >= -4 &&
    bounds.top <= 140
  )
}

function handleWheel(event: WheelEvent) {
  if (reducedMotion.value) return

  const isExpanding = event.deltaY > 0 && targetProgress < 1
  const isCollapsing = event.deltaY < 0 && targetProgress > 0 && isHeroAtPageStart()

  if (!isExpanding && !isCollapsing) return

  event.preventDefault()
  updateProgress(clamp(event.deltaY, -120, 120) / 680)
}

function handleTouchStart(event: TouchEvent) {
  touchY = event.touches[0]?.clientY ?? null
}

function handleTouchMove(event: TouchEvent) {
  const currentY = event.touches[0]?.clientY

  if (reducedMotion.value || touchY === null || currentY === undefined) return

  const deltaY = touchY - currentY
  const isExpanding = deltaY > 0 && targetProgress < 1
  const isCollapsing = deltaY < 0 && targetProgress > 0 && isHeroAtPageStart()

  if (!isExpanding && !isCollapsing) {
    touchY = currentY
    return
  }

  event.preventDefault()
  updateProgress(deltaY / 520)
  touchY = currentY
}

function handleTouchEnd() {
  touchY = null
}

function handleMotionPreferenceChange() {
  reducedMotion.value = motionPreference?.matches ?? false

  if (reducedMotion.value) {
    gsap.killTweensOf(progressProxy)
    targetProgress = 1
    progressProxy.value = 1
    renderProgress()
  }
}

onMounted(() => {
  if (!section.value || !media.value) return

  updateToday()
  dateUpdateTimer = window.setInterval(updateToday, 60_000)
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionPreference.matches
  targetProgress = reducedMotion.value ? 1 : 0
  progressProxy.value = targetProgress

  gsapContext = gsap.context(() => {
    progressTo = gsap.quickTo(progressProxy, 'value', {
      duration: 0.34,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: renderProgress,
    })

    measureLayout()
  }, section.value)

  resizeObserver = new ResizeObserver(measureLayout)
  resizeObserver.observe(media.value)
  if (dailySlot.value) resizeObserver.observe(dailySlot.value)
  if (dailyPanel.value) resizeObserver.observe(dailyPanel.value)
  if (newspaper.value) resizeObserver.observe(newspaper.value)

  iconObserver = new IntersectionObserver(([entry]) => {
    isWeatherIconActive.value = entry?.isIntersecting ?? false
  })
  iconObserver.observe(section.value)

  section.value.addEventListener('wheel', handleWheel, { passive: false })
  section.value.addEventListener('touchstart', handleTouchStart, { passive: true })
  section.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  section.value.addEventListener('touchend', handleTouchEnd)
  section.value.addEventListener('touchcancel', handleTouchEnd)
  motionPreference.addEventListener('change', handleMotionPreferenceChange)
})

onUnmounted(() => {
  if (dateUpdateTimer !== undefined) window.clearInterval(dateUpdateTimer)
  resizeObserver?.disconnect()
  iconObserver?.disconnect()
  motionPreference?.removeEventListener('change', handleMotionPreferenceChange)
  section.value?.removeEventListener('wheel', handleWheel)
  section.value?.removeEventListener('touchstart', handleTouchStart)
  section.value?.removeEventListener('touchmove', handleTouchMove)
  section.value?.removeEventListener('touchend', handleTouchEnd)
  section.value?.removeEventListener('touchcancel', handleTouchEnd)
  gsap.killTweensOf(progressProxy)
  gsapContext?.revert()
})
</script>

<template>
  <section
    ref="section"
    class="weather-hero"
    :class="{
      'is-expanded': isExpanded,
      'is-interacting': isInteracting,
      'is-reduced-motion': reducedMotion,
    }"
    aria-labelledby="weather-hero-title"
  >
    <div class="weather-hero__stage layout-container">
      <article
        ref="media"
        class="weather-window base-card base-card--glass"
        tabindex="0"
        aria-label="菲迪日報與五天天氣"
      >
        <div ref="newspaper" class="weather-newspaper">
          <div ref="topRule" class="weather-newspaper__rule" aria-hidden="true"></div>
          <div class="weather-newspaper__body">
            <div ref="dailySlot" class="weather-daily-slot">
              <div ref="dailyPanel" class="weather-daily">
                <header class="weather-daily__header">
                  <p class="weather-daily__eyebrow" lang="en">Pheidi Daily</p>
                  <p class="weather-daily__title">菲迪日報</p>
                  <time class="weather-daily__date" :datetime="todayDateTime">{{
                    todayDisplay
                  }}</time>
                </header>

                <div class="weather-daily__artwork">
                  <img
                    class="weather-daily__ally"
                    src="/images/ally.png"
                    alt=""
                    width="480"
                    height="480"
                  />
                </div>
              </div>
            </div>

            <div ref="content" class="weather-window__content">
              <div class="weather-today base-card base-card--glass">
                <div class="weather-summary">
                  <span v-if="props.isLoading" class="weather-summary__status" role="status">
                    天氣資料載入中...
                  </span>
                  <span v-else-if="props.error" class="weather-summary__status" role="alert">
                    {{ props.error }}
                  </span>
                  <template v-else-if="props.weather">
                    <div class="weather-summary__location">
                      <MapPin :size="17" aria-hidden="true" />
                      {{ props.locationLabel }}
                    </div>
                    <div class="weather-summary__conditions">
                      <div class="weather-summary__temperature">
                        <div>
                          <strong>{{ Math.round(props.weather.temperature) }}°C</strong>
                          <span>體感 {{ Math.round(props.weather.apparentTemperature) }}°C</span>
                        </div>
                      </div>
                      <div class="weather-summary__details">
                        <span
                          ><CloudRain :size="15" aria-hidden="true" />降雨
                          {{ props.weather.precipitationProbability }}%</span
                        >
                        <span
                          ><Wind :size="15" aria-hidden="true" />{{
                            Math.round(props.weather.windSpeed)
                          }}
                          km/h</span
                        >
                      </div>
                    </div>
                  </template>
                </div>
                <div class="weather-window__headline">
                  <h1 id="weather-hero-title" class="weather-window__title">{{ props.title }}</h1>
                  <div
                    class="weather-visual"
                    :class="`weather-visual--${props.tone}`"
                    aria-hidden="true"
                  >
                    <span class="weather-visual__main">
                      <AnimatedWeatherIcon
                        :variant="props.mainIcon"
                        :size="152"
                        :stroke-width="1.15"
                        :active="isWeatherIconActive && !reducedMotion"
                      />
                    </span>
                  </div>
                </div>
              </div>

              <section class="weather-forecast" aria-label="未來四天天氣預報">
                <p v-if="props.isLoading" class="weather-summary__status" role="status">
                  天氣預報載入中...
                </p>
                <p v-else-if="props.forecastError" class="weather-summary__status" role="alert">
                  {{ props.forecastError }}
                </p>
                <ul v-else-if="upcomingForecast.length" class="weather-forecast__list">
                  <li v-for="day in upcomingForecast" :key="day.date" class="weather-forecast__day">
                    <time :datetime="day.date">{{ day.date.replaceAll('-', '.') }}</time>
                    <strong :aria-label="`最高 ${Math.round(day.temperatureMax)} 度`"
                      >{{ Math.round(day.temperatureMax) }}°C</strong
                    >
                    <span class="weather-forecast__rain"
                      ><CloudRain :size="14" aria-hidden="true" />降雨
                      {{
                        day.precipitationProbability === null
                          ? '—'
                          : `${Math.round(day.precipitationProbability)}%`
                      }}</span
                    >
                  </li>
                </ul>
                <p v-else class="weather-summary__status" role="status">目前沒有天氣預報資料</p>
              </section>
            </div>
          </div>
          <div ref="bottomRule" class="weather-newspaper__rule" aria-hidden="true"></div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.weather-hero {
  position: relative;
  isolation: isolate;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  background: transparent;
}

.weather-hero.is-interacting {
  touch-action: none;
}

.weather-hero__stage {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-areas: 'stage';
  place-items: center;
  /* MainLayout 讓 Hero 從頁首起算；只在 Header 下方的可用區域置中。 */
  margin-block-start: var(--app-header-height);
  height: calc(100% - var(--app-header-height));
  min-height: 0;
  padding-block: var(--space-6);
}

.weather-window {
  grid-area: stage;
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 720px;
  min-height: 0;
  overflow: hidden;
  clip-path: inset(50% round var(--radius-xl));
  color: var(--color-text);
  border-radius: var(--radius-xl);
  will-change: clip-path;
  scrollbar-width: none;
}

.weather-hero.is-expanded .weather-window {
  overflow-y: auto;
}

.weather-window:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: calc(-1 * var(--space-1));
}

.weather-newspaper {
  --weather-daily-width: 300px;

  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--space-6);
  height: 100%;
  padding: var(--space-8);
}

.weather-newspaper__rule {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  transform-origin: center;
  will-change: transform;
}

.weather-newspaper__rule::before,
.weather-newspaper__rule::after {
  height: 1px;
  background-color: color-mix(in srgb, var(--color-primary) 65%, transparent);
  content: '';
}

.weather-newspaper__body {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
  gap: var(--space-7);
  align-items: stretch;
  min-width: 0;
  min-height: 0;
}

.weather-daily-slot {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  place-items: center;
  min-width: 0;
  min-height: 0;
}

.weather-daily {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-7);
  width: var(--weather-daily-width);
  transform-origin: center;
  will-change: transform;
}

.weather-daily__header {
  width: 100%;
  margin-block-start: var(--space-2);
  margin-block-end: calc(-1 * var(--space-2));
  text-align: center;
}

.weather-daily__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.weather-daily__title {
  margin: 0;
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-base);
}

.weather-daily__date {
  display: block;
  margin-top: var(--space-5);
  color: var(--color-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-wide);
  font-variant-numeric: tabular-nums;
}

.weather-daily__artwork {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  place-items: center;
  width: 100%;
  aspect-ratio: 1.22;
  padding: var(--space-4);
  overflow: hidden;
  background-color: var(--color-primary-soft);
  border-radius: var(--radius-lg);
}

.weather-daily__ally {
  display: block;
  width: 180%;
  max-width: none;
  height: 180%;
  max-height: none;
  min-height: 0;
  object-fit: contain;
}

.weather-window__content {
  --weather-forecast-edge-alignment: var(--space-6);

  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  align-content: stretch;
  gap: var(--space-4);
  min-width: 0;
  min-height: 0;
  padding: var(--space-6);
  background-color: var(--color-primary-light);
  border-radius: var(--radius-lg);
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.weather-window__headline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(80px, 0.8fr);
  align-items: center;
  gap: var(--space-5);
  min-width: 0;
  padding: 0;
}

.weather-window__title {
  max-width: 10ch;
  min-width: 0;
  margin: 0;
  margin-inline-start: var(--space-2);
  color: var(--color-primary);
  font-size: clamp(var(--font-size-md), 2.6vw, var(--font-size-xl));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-tight);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.weather-visual {
  position: relative;
  justify-self: end;
  width: 100%;
  margin-inline-end: var(--weather-forecast-edge-alignment);
  aspect-ratio: 1;
  color: var(--color-accent);
}

.weather-visual__main {
  display: grid;
  place-items: center;
  color: var(--color-primary);
}

.weather-visual--hot .weather-visual__main {
  color: var(--color-accent);
}

.weather-summary {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: center;
  gap: var(--space-3);
  min-width: 0;
  margin-inline-start: var(--weather-forecast-edge-alignment);
  padding: 0;
  background: transparent;
}

.weather-summary__status {
  max-width: 32ch;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.weather-summary__temperature {
  display: block;
  text-align: center;
}

.weather-summary__temperature div {
  display: grid;
  gap: var(--space-1);
}

.weather-summary__temperature strong {
  color: var(--color-text);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-tight);
}

.weather-summary__temperature span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.weather-summary__location {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-2);
  max-width: 100%;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-base);
  overflow-wrap: anywhere;
}

.weather-summary__conditions {
  display: grid;
  grid-template-columns: max-content;
  gap: var(--space-3);
  max-width: 100%;
}

.weather-summary__details {
  display: grid;
  grid-template-columns: max-content;
  gap: var(--space-2);
  max-width: 100%;
}

.weather-summary__details span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  inline-size: 100%;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
  background-color: color-mix(in srgb, var(--color-surface) 70%, transparent);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-base);
}

.weather-summary__details svg,
.weather-summary__location svg {
  flex-shrink: 0;
}

@media (max-width: 1100px), (max-height: 820px) {
  .weather-newspaper {
    padding: var(--space-6);
    gap: var(--space-5);
  }

  .weather-newspaper__body {
    gap: var(--space-5);
  }

  .weather-window__content {
    padding: var(--space-5);
  }

  .weather-window__headline {
    grid-template-columns: minmax(0, 1fr) minmax(72px, 0.8fr);
    gap: var(--space-4);
    padding: 0;
  }

  .weather-window__title {
    font-size: var(--font-size-lg);
  }
}

@media (min-width: 1001px) {
  .weather-newspaper__body {
    grid-template-columns: minmax(0, var(--weather-daily-width)) minmax(0, 1fr);
  }

  .weather-window__content {
    margin-inline-start: var(--space-5);
    padding-inline: var(--space-5);
  }
}

@media (min-width: 721px) and (max-width: 1000px) {
  .weather-newspaper__body {
    gap: var(--space-5);
  }

  .weather-window__content {
    padding: var(--space-4);
  }

  .weather-window__headline {
    grid-template-columns: minmax(0, 1fr) 96px;
    gap: var(--space-3);
  }

  .weather-window__title {
    font-size: var(--font-size-md);
  }

  .weather-visual__main svg {
    width: 96px;
    height: 96px;
  }
}

@media (max-width: 720px) {
  .weather-hero__stage {
    padding-block: var(--space-4);
  }

  .weather-newspaper {
    --weather-daily-width: 240px;

    height: auto;
    min-height: 100%;
    padding: var(--space-5);
    gap: var(--space-5);
  }

  .weather-newspaper__body {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
  }

  .weather-daily-slot {
    min-height: 360px;
  }

  .weather-daily {
    gap: var(--space-5);
  }

  .weather-daily__date {
    margin-top: var(--space-3);
    font-size: var(--font-size-sm);
  }

  .weather-window__content {
    grid-template-rows: auto auto;
    padding: var(--space-4);
  }

  .weather-window__headline {
    grid-template-columns: minmax(0, 1fr) 96px;
    gap: var(--space-3);
    padding: var(--space-3);
    min-height: 0;
  }

  .weather-window__title {
    font-size: var(--font-size-md);
  }

  .weather-visual__main svg {
    width: 96px;
    height: 96px;
  }
}

.weather-today {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 2fr);
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.weather-visual__main svg {
  width: 100%;
  height: auto;
}

.weather-forecast__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.weather-forecast__day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
  text-align: center;
  color: var(--color-surface);
  font-size: var(--font-size-xs);
  letter-spacing: var(--letter-spacing-tight);
  font-variant-numeric: tabular-nums;
}

.weather-forecast__day:not(:last-child)::after {
  position: absolute;
  inset-block: var(--space-2);
  inset-inline-end: calc(var(--space-3) / -2);
  width: 1px;
  background-color: var(--color-surface);
  content: '';
}

.weather-forecast__day time {
  margin-bottom: var(--space-1);
  font-size: var(--font-size-xs);
}

.weather-forecast__day strong {
  font-size: var(--font-size-md);
  line-height: var(--line-height-tight);
}

.weather-forecast__rain {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

@media (max-width: 1100px) {
  .weather-window__content {
    --weather-forecast-edge-alignment: var(--space-4);
  }

  .weather-today {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .weather-summary {
    grid-row: 2;
  }

  .weather-forecast__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: var(--space-5);
  }

  .weather-forecast__day::after {
    display: none;
  }

  .weather-forecast__day:nth-child(odd)::after {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-window {
    clip-path: inset(0 round var(--radius-xl));
    will-change: auto;
  }

  .weather-window__content {
    visibility: visible;
    opacity: 1;
    transform: none;
    will-change: auto;
  }

  .weather-daily,
  .weather-newspaper__rule {
    will-change: auto;
  }
}
</style>
