<script setup lang="ts">
import { ArrowDown, CloudSun, MapPin, Sun, Wind } from '@lucide/vue'
import gsap from 'gsap'
import type { Component } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import type { CurrentWeather } from '@/services/weather'
import Cloudscape from '@/components/home/Cloudscape.vue'

interface Props {
  title: string
  tone: string
  mainIcon: Component
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
const artwork = ref<HTMLElement | null>(null)
const scrollCue = ref<HTMLElement | null>(null)
const isExpanded = ref(false)
const isInteracting = ref(true)
const reducedMotion = ref(false)

const progressProxy = { value: 0 }
let targetProgress = 0
let touchY: number | null = null
let progressTo: ((value: number) => void) | null = null
let resizeObserver: ResizeObserver | null = null
let motionPreference: MediaQueryList | null = null
let gsapContext: gsap.Context | null = null

const instruction = computed(() => (reducedMotion.value ? '今日跑步天氣' : '向下滑動，讓天空展開'))

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum)
}

function renderProgress() {
  if (!media.value || !content.value || !artwork.value || !scrollCue.value) return

  const progress = reducedMotion.value ? 1 : clamp(progressProxy.value)
  const bounds = media.value.getBoundingClientRect()
  const initialWidth = Math.min(300, Math.max(0, bounds.width - 32))
  const initialHeight = Math.min(400, Math.max(0, bounds.height - 32))
  const horizontalInset = ((bounds.width - initialWidth) / 2) * (1 - progress)
  const verticalInset = ((bounds.height - initialHeight) / 2) * (1 - progress)
  const contentProgress = clamp((progress - 0.48) / 0.38)
  const isMobile = bounds.width <= 720
  const artworkOffset = isMobile
    ? Math.min(bounds.height * 0.2, 130) * progress
    : Math.min(bounds.width * 0.22, 300) * progress

  gsap.set(media.value, {
    clipPath: `inset(${verticalInset}px ${horizontalInset}px round var(--radius-xl))`,
  })
  gsap.set(content.value, {
    autoAlpha: contentProgress,
    y: (1 - contentProgress) * 24,
  })
  gsap.set(artwork.value, {
    x: isMobile ? 0 : artworkOffset,
    y: isMobile ? artworkOffset : 0,
    scale: 0.88 + progress * 0.12,
  })
  gsap.set(scrollCue.value, {
    autoAlpha: clamp(1 - progress * 2.4),
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

  section.value.addEventListener('wheel', handleWheel, { passive: false })
  section.value.addEventListener('touchstart', handleTouchStart, { passive: true })
  section.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  section.value.addEventListener('touchend', handleTouchEnd)
  section.value.addEventListener('touchcancel', handleTouchEnd)
  motionPreference.addEventListener('change', handleMotionPreferenceChange)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
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
        <div ref="content" class="weather-window__content">
          <h1 id="weather-hero-title" class="weather-window__title">
            {{ props.title }}
          </h1>

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

        <div
          ref="artwork"
          class="weather-artwork"
          :class="`weather-artwork--${props.tone}`"
          aria-hidden="true"
        >
          <span class="weather-artwork__sun">
            <component :is="props.accentIcon" :size="132" :stroke-width="1.15" />
          </span>

          <span class="weather-artwork__cloud">
            <component :is="props.mainIcon" :size="176" :stroke-width="1.15" />
          </span>
        </div>
      </article>

      <div ref="scrollCue" class="weather-window__scroll-cue" aria-hidden="true">
        <ArrowDown :size="18" :stroke-width="2" />
        <span>{{ instruction }}</span>
      </div>
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
  height: clamp(8rem, 24vh, 16rem);
  pointer-events: none;
  content: '';
  background: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--color-background) 42%, transparent) 55%,
    var(--color-background) 100%
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
  min-height: 0;
  overflow: hidden;
  clip-path: inset(calc(50% - 200px) calc(50% - 150px) round var(--radius-xl));
  color: var(--color-text);
  border-radius: var(--radius-xl);
  will-change: clip-path;
}

.weather-window__content {
  position: relative;
  z-index: 2;
  width: min(50%, 620px);
  margin-left: clamp(var(--space-5), 7vw, 96px);
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.weather-window__title {
  max-width: 12ch;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(var(--font-size-xl), 4.3vw, var(--font-size-display));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  text-wrap: balance;
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

.weather-artwork {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 300px;
  height: 400px;
  color: var(--color-accent);
  transform: translate(-50%, -50%) scale(0.88);
  transform-origin: center;
  will-change: transform;
}

.weather-artwork__sun,
.weather-artwork__cloud {
  position: absolute;
  display: grid;
  place-items: center;
}

.weather-artwork__sun {
  top: 62px;
  right: 18px;
  opacity: 0.7;
}

.weather-artwork__cloud {
  right: 64px;
  bottom: 70px;
  color: var(--color-primary);
}

.weather-artwork--rain .weather-artwork__sun,
.weather-artwork--cold .weather-artwork__sun {
  color: var(--color-dark-pale);
}

.weather-artwork--hot .weather-artwork__sun,
.weather-artwork--hot .weather-artwork__cloud {
  color: var(--color-accent);
}

.weather-window__scroll-cue {
  grid-area: stage;
  align-self: center;
  justify-self: center;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  color: var(--color-text);
  background-color: color-mix(in srgb, var(--color-surface) 78%, transparent);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-base);
  transform: translateY(230px);
  white-space: nowrap;
  will-change: transform, opacity;
}

.weather-window__scroll-cue svg {
  flex: 0 0 auto;
}

@media (max-width: 720px) {
  .weather-hero__stage {
    padding: var(--space-4) var(--layout-gutter);
  }

  .weather-window {
    clip-path: inset(calc(50% - 200px) calc(50% - 150px) round var(--radius-xl));
  }

  .weather-window__content {
    align-self: start;
    width: auto;
    margin: var(--space-7) var(--space-5) 0;
  }

  .weather-window__title {
    max-width: 13ch;
    font-size: clamp(var(--font-size-lg), 9vw, var(--font-size-xl));
  }

  .weather-summary {
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .weather-summary__details {
    gap: var(--space-2);
  }

  .weather-artwork {
    width: 280px;
    height: 360px;
  }

  .weather-window__scroll-cue {
    max-width: calc(100% - (var(--space-4) * 2));
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

  .weather-artwork,
  .weather-window__scroll-cue {
    will-change: auto;
  }

  .weather-window__scroll-cue {
    display: none;
  }
}
</style>
