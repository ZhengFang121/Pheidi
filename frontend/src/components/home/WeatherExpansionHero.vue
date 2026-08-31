<script setup lang="ts">
import { CloudSun, MapPin, Sun, Wind } from '@lucide/vue'
import gsap from 'gsap'
import type { Component } from 'vue'
import { onMounted, onUnmounted, ref } from 'vue'

import AnimatedWeatherIcon from '@/components/icons/AnimatedWeatherIcon.vue'
import type { CurrentWeather } from '@/services/weather'
import type { WeatherIconVariant } from '@/types/weatherIcon'
import Cloudscape from '@/components/home/Cloudscape.vue'

interface Props {
  title: string
  tone: string
  mainIcon: WeatherIconVariant
  accentIcon: Component
  weather: CurrentWeather | null
  isLoading: boolean
  error: string
  locationLabel: string
}

const props = defineProps<Props>()

const section = ref<HTMLElement | null>(null)
const media = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const dailyPanel = ref<HTMLElement | null>(null)
const allyArtwork = ref<HTMLImageElement | null>(null)
const isExpanded = ref(false)
const isInteracting = ref(true)
const isWeatherIconActive = ref(true)
const reducedMotion = ref(false)
const todayDisplay = ref('')
const todayDateTime = ref('')

const progressProxy = { value: 0 }
let targetProgress = 0
let touchY: number | null = null
let progressTo: ((value: number) => void) | null = null
let resizeObserver: ResizeObserver | null = null
let iconObserver: IntersectionObserver | null = null
let motionPreference: MediaQueryList | null = null
let gsapContext: gsap.Context | null = null
let dateUpdateTimer: number | undefined

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum)
}

function updateToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  todayDisplay.value = `${year}.${month}.${day}`
  todayDateTime.value = `${year}-${month}-${day}`
}

function renderProgress() {
  if (!media.value || !content.value || !dailyPanel.value || !allyArtwork.value) return

  const progress = reducedMotion.value ? 1 : clamp(progressProxy.value)
  const bounds = media.value.getBoundingClientRect()
  const isMobile = bounds.width <= 720
  const initialWidth = Math.min(isMobile ? 300 : 400, Math.max(0, bounds.width - 32))
  const initialHeight = Math.min(isMobile ? 400 : 500, Math.max(0, bounds.height - 32))
  const horizontalInset = ((bounds.width - initialWidth) / 2) * (1 - progress)
  const verticalInset = ((bounds.height - initialHeight) / 2) * (1 - progress)
  const contentProgress = clamp((progress - 0.42) / 0.42)
  const dailyPanelOffset = isMobile
    ? Math.min(bounds.height * 0.24, 148) * progress
    : Math.min(bounds.width * 0.27, 310) * progress

  gsap.set(media.value, {
    clipPath: `inset(${verticalInset}px ${horizontalInset}px round var(--radius-xl))`,
  })
  gsap.set(content.value, {
    autoAlpha: contentProgress,
    y: (1 - contentProgress) * 24,
  })
  gsap.set(dailyPanel.value, {
    xPercent: -50,
    yPercent: -50,
    x: isMobile ? 0 : -dailyPanelOffset,
    y: isMobile ? -dailyPanelOffset : 0,
    scale: 1 - (isMobile ? progress * 0.18 : 0),
  })
  gsap.set(allyArtwork.value, {
    y: isMobile ? 0 : -80,
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
  return window.scrollY <= 4 && bounds.top >= -4 && bounds.top <= 140
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

    renderProgress()
  }, section.value)

  resizeObserver = new ResizeObserver(renderProgress)
  resizeObserver.observe(media.value)

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
    <Cloudscape />

    <div class="weather-hero__stage">
      <article ref="media" class="weather-window base-card base-card--glass">
        <div ref="dailyPanel" class="weather-daily">
          <header class="weather-daily__header">
            <p class="weather-daily__title">菲迪日報</p>
            <time class="weather-daily__date" :datetime="todayDateTime">{{ todayDisplay }}</time>
          </header>

          <div class="weather-daily__divider" aria-hidden="true"></div>

          <img
            ref="allyArtwork"
            class="weather-daily__ally"
            src="/images/ally.png"
            alt=""
            width="480"
            height="480"
          />
        </div>

        <div ref="content" class="weather-window__content">
          <div class="weather-window__headline">
            <h1 id="weather-hero-title" class="weather-window__title">
              {{ props.title }}
            </h1>

            <div class="weather-visual" :class="`weather-visual--${props.tone}`" aria-hidden="true">
              <span class="weather-visual__accent">
                <component :is="props.accentIcon" :size="112" :stroke-width="1.15" />
              </span>

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

          <div class="weather-summary">
            <span v-if="props.isLoading" class="weather-summary__status" role="status">
              天氣資料載入中...
            </span>

            <span v-else-if="props.error" class="weather-summary__status" role="alert">
              {{ props.error }}
            </span>

            <template v-else-if="props.weather">
              <div class="weather-summary__temperature">
                <CloudSun :size="38" :stroke-width="1.8" aria-hidden="true" />

                <div>
                  <strong>{{ Math.round(props.weather.temperature) }}°C</strong>
                  <span>體感 {{ Math.round(props.weather.apparentTemperature) }}°C</span>
                </div>
              </div>

              <div class="weather-summary__details">
                <span>
                  <Sun :size="17" aria-hidden="true" />
                  降雨 {{ props.weather.precipitationProbability }}%
                </span>

                <span>
                  <Wind :size="17" aria-hidden="true" />
                  風速 {{ Math.round(props.weather.windSpeed) }} km/h
                </span>

                <span>
                  <MapPin :size="17" aria-hidden="true" />
                  {{ props.locationLabel }}
                </span>
              </div>
            </template>
          </div>
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
  background-color: var(--color-primary-pale);
}

.weather-hero::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  height: clamp(var(--space-8), 12vh, 8rem);
  pointer-events: none;
  content: '';
  background: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--color-background) 42%, transparent) 55%,
    color-mix(in srgb, var(--color-background) 48%, var(--color-primary-pale)) 100%
  );
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
  height: 100%;
  min-height: 0;
  padding: calc(var(--app-header-height) + var(--space-5)) var(--layout-gutter) var(--space-5);
}

.weather-window {
  grid-area: stage;
  position: relative;
  display: grid;
  align-items: center;
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: 650px;
  min-height: 0;
  overflow: hidden;
  clip-path: inset(calc(50% - 250px) calc(50% - 200px) round var(--radius-xl));
  color: var(--color-text);
  border-radius: var(--radius-xl);
  will-change: clip-path;
}

.weather-daily {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: min(400px, calc(100% - (var(--space-6) * 2)));
  height: min(500px, calc(100% - (var(--space-6) * 2)));
  transform: translate(-50%, -50%);
  transform-origin: center;
  will-change: transform;
}

.weather-daily__header {
  margin-top: var(--space-8);
  text-align: center;
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
  margin-top: var(--space-1);
  color: var(--color-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-wide);
  font-variant-numeric: tabular-nums;
}

.weather-daily__divider {
  width: calc(100% - (var(--space-7) * 2));
  height: 1px;
  margin: var(--space-6) auto 0;
  background-color: var(--color-primary-soft);
}

.weather-daily__ally {
  display: block;
  width: min(380px, 96%);
  height: auto;
  margin: var(--space-5) auto 0;
  object-fit: contain;
  will-change: transform;
}

.weather-window__content {
  position: relative;
  top: calc(var(--space-5) * -1);
  z-index: 2;
  width: min(51%, 560px);
  margin-right: clamp(var(--space-5), 5vw, var(--space-8));
  margin-left: auto;
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.weather-window__headline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 200px);
  align-items: center;
  gap: var(--space-4);
}

.weather-window__title {
  max-width: 9ch;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(var(--font-size-lg), 4vw, var(--font-size-display));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  text-wrap: balance;
}

.weather-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  color: var(--color-accent);
}

.weather-visual__accent,
.weather-visual__main {
  position: absolute;
  display: grid;
  place-items: center;
}

.weather-visual__accent {
  top: 0;
  right: 0;
  opacity: 0.55;
}

.weather-visual__main {
  right: var(--space-5);
  bottom: 0;
  color: var(--color-primary);
}

.weather-visual--rain .weather-visual__accent,
.weather-visual--cold .weather-visual__accent {
  color: var(--color-dark-pale);
}

.weather-visual--hot .weather-visual__accent,
.weather-visual--hot .weather-visual__main {
  color: var(--color-accent);
}

.weather-summary {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.weather-summary__status {
  max-width: 32ch;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.weather-summary__temperature {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-accent);
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

.weather-summary__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.weather-summary__details span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
  background-color: color-mix(in srgb, var(--color-surface) 70%, transparent);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-base);
}

@media (max-width: 720px) {
  .weather-hero__stage {
    padding: var(--space-4) var(--layout-gutter);
  }

  .weather-window {
    clip-path: inset(calc(50% - 200px) calc(50% - 150px) round var(--radius-xl));
  }

  .weather-daily {
    width: min(300px, calc(100% - (var(--space-5) * 2)));
    height: min(400px, calc(100% - (var(--space-5) * 2)));
  }

  .weather-daily__header {
    margin-top: var(--space-7);
  }

  .weather-daily__title {
    font-size: var(--font-size-md);
  }

  .weather-daily__date {
    font-size: var(--font-size-sm);
  }

  .weather-daily__divider {
    width: calc(100% - (var(--space-5) * 2));
    margin-top: var(--space-5);
  }

  .weather-daily__ally {
    width: min(250px, 84%);
    margin-top: var(--space-5);
  }

  .weather-window__content {
    top: 0;
    align-self: end;
    width: auto;
    margin: 0 var(--space-5) var(--space-5);
  }

  .weather-window__headline {
    grid-template-columns: minmax(0, 1fr) 112px;
    gap: var(--space-3);
  }

  .weather-window__title {
    max-width: 11ch;
    font-size: clamp(var(--font-size-md), 7.5vw, var(--font-size-xl));
  }

  .weather-summary {
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .weather-summary__details {
    gap: var(--space-2);
  }

  .weather-visual__accent svg {
    width: 72px;
    height: 72px;
  }

  .weather-visual__main {
    right: 0;
  }

  .weather-visual__main svg {
    width: 96px;
    height: 96px;
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

  .weather-daily {
    will-change: auto;
  }

  .weather-daily__ally {
    will-change: auto;
  }
}
</style>
