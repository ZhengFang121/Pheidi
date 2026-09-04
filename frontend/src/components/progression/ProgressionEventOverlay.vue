<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Sparkles } from '@lucide/vue'
import gsap from 'gsap'

import BadgeImage from '@/components/badges/BadgeImage.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { ProgressionEvent } from '@/types/progressionEvent'

const BADGE_BACK_IMAGE_PATH = '/images/badges/badge-back.png'
const IMAGE_PRELOAD_TIMEOUT = 3500

const props = defineProps<{
  event: ProgressionEvent
  eventKey: number
  badgeIndex?: number
  badgeTotal?: number
  hasFollowingEvent: boolean
}>()

const emit = defineEmits<{
  continue: []
  error: []
}>()

const overlay = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const eyebrow = ref<HTMLElement | null>(null)
const visual = ref<HTMLElement | null>(null)
const visualRing = ref<HTMLElement | null>(null)
const flipper = ref<HTMLElement | null>(null)
const highlight = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const description = ref<HTMLElement | null>(null)
const continueButton = ref<HTMLElement | null>(null)

const isReducedMotion = ref(false)
const isTransitioning = ref(true)
const frontImagePath = ref('')
const frontImageName = ref('')

let animationContext: gsap.Context | undefined
let entranceTimeline: gsap.core.Timeline | undefined
let exitTween: gsap.core.Tween | undefined
let reducedMotionQuery: MediaQueryList | undefined
let preloadRequestId = 0
let hasEntered = false
let originalBodyOverflow = ''

const eventTypeLabel = computed(() => (props.event.type === 'badge' ? '獲得新徽章' : '階段提升'))

const eventTitle = computed(() =>
  props.event.type === 'badge'
    ? props.event.name
    : `Lv.${props.event.toLevel} ${props.event.toName}`,
)

const eventDescription = computed(() =>
  props.event.type === 'badge'
    ? props.event.description
    : (props.event.description ?? '你的旅程又向前了一步。'),
)

const previousLevelLabel = computed(() => {
  if (props.event.type !== 'level') return ''

  return `Lv.${props.event.fromLevel}${props.event.fromName ? ` ${props.event.fromName}` : ''}`
})

const buttonLabel = '繼續'

const announcement = computed(() => {
  const progress =
    props.badgeIndex && props.badgeTotal
      ? `，第 ${props.badgeIndex} 枚，共 ${props.badgeTotal} 枚`
      : ''

  return `${eventTypeLabel.value}${progress}：${eventTitle.value}。${eventDescription.value}`
})

const levelImagePath = (level: number) => `/images/badges/level-${level}.png`

const setInitialFrontImage = () => {
  if (props.event.type === 'badge') {
    frontImagePath.value = props.event.imagePath
    frontImageName.value = props.event.name
    return
  }

  frontImagePath.value = levelImagePath(props.event.fromLevel)
  frontImageName.value = previousLevelLabel.value
}

const showNewLevelFront = () => {
  if (props.event.type !== 'level') return

  frontImagePath.value = levelImagePath(props.event.toLevel)
  frontImageName.value = `Lv.${props.event.toLevel} ${props.event.toName}`
}

const getPreloadPaths = () => {
  const paths = [BADGE_BACK_IMAGE_PATH]

  if (props.event.type === 'badge') {
    paths.push(props.event.imagePath)
  } else {
    paths.push(levelImagePath(props.event.fromLevel), levelImagePath(props.event.toLevel))
  }

  return [...new Set(paths)]
}

const preloadImage = (path: string) =>
  new Promise<void>((resolve) => {
    const image = new Image()
    let timeoutId = 0

    const finish = () => {
      window.clearTimeout(timeoutId)
      image.onload = null
      image.onerror = null
      resolve()
    }

    image.onload = finish
    image.onerror = finish
    timeoutId = window.setTimeout(finish, IMAGE_PRELOAD_TIMEOUT)
    image.src = path

    if (image.complete) finish()
  })

const focusContinueButton = () => {
  continueButton.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
}

const completeEntrance = () => {
  isTransitioning.value = false
  focusContinueButton()
}

const addHighlightSweep = (timeline: gsap.core.Timeline, position: number, peakOpacity: number) => {
  if (!highlight.value) return

  timeline
    .set(
      highlight.value,
      {
        opacity: 0,
        visibility: 'visible',
        xPercent: -270,
        yPercent: -16,
        rotation: 20,
      },
      position,
    )
    .to(
      highlight.value,
      {
        opacity: peakOpacity,
        xPercent: 0,
        yPercent: 0,
        duration: 0.31,
        ease: 'power2.inOut',
      },
      position,
    )
    .to(
      highlight.value,
      {
        opacity: 0,
        xPercent: 270,
        yPercent: 16,
        duration: 0.31,
        ease: 'power2.inOut',
      },
      position + 0.31,
    )
    .set(
      highlight.value,
      {
        opacity: 0,
        visibility: 'hidden',
        xPercent: -270,
        yPercent: -16,
        rotation: 20,
      },
      position + 0.62,
    )
}

const createBadgeTimeline = () => {
  if (!overlay.value || !visual.value || !flipper.value) return

  entranceTimeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: completeEntrance,
  })

  if (!hasEntered) {
    entranceTimeline.fromTo(
      overlay.value,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.28, ease: 'power1.out' },
      0,
    )
  }

  entranceTimeline
    .to(eyebrow.value, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.12)
    .to(visualRing.value, { autoAlpha: 0.68, scale: 1, duration: 0.52 }, 0.24)
    .to(visual.value, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' }, 0.2)
    .to(
      flipper.value,
      {
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        duration: 1.18,
        ease: 'power3.out',
      },
      0.2,
    )
    .to(flipper.value, { scale: 1.07, duration: 0.14, ease: 'power2.out' }, 1.28)
    .to(flipper.value, { scale: 1, duration: 0.2, ease: 'power2.inOut' }, 1.42)
    .to(title.value, { autoAlpha: 1, y: 0, duration: 0.42 }, 1.48)
    .to(description.value, { autoAlpha: 1, y: 0, duration: 0.38 }, 1.62)
    .to(continueButton.value, { autoAlpha: 1, y: 0, duration: 0.32 }, 1.9)

  addHighlightSweep(entranceTimeline, 1.62, 0.72)
}

const createLevelTimeline = () => {
  if (!overlay.value || !visual.value || !flipper.value) return

  entranceTimeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: completeEntrance,
  })

  if (!hasEntered) {
    entranceTimeline.fromTo(
      overlay.value,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.28, ease: 'power1.out' },
      0,
    )
  }

  entranceTimeline
    .to(eyebrow.value, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.12)
    .to(visualRing.value, { autoAlpha: 0.88, scale: 1, duration: 0.52 }, 0.2)
    .to(visual.value, { autoAlpha: 1, scale: 1, duration: 0.42 }, 0.18)
    .to(flipper.value, { rotationY: 180, duration: 0.72, ease: 'power3.inOut' }, 0.76)
    .call(showNewLevelFront, [], 1.48)
    .to(flipper.value, { rotationY: 360, duration: 0.72, ease: 'power3.inOut' }, 1.68)
    .to(flipper.value, { scale: 1.08, duration: 0.14, ease: 'power2.out' }, 2.34)
    .to(flipper.value, { scale: 1, duration: 0.2, ease: 'power2.inOut' }, 2.48)
    .to(title.value, { autoAlpha: 1, y: 0, duration: 0.4 }, 2.4)
    .to(description.value, { autoAlpha: 1, y: 0, duration: 0.36 }, 2.54)
    .to(continueButton.value, { autoAlpha: 1, y: 0, duration: 0.3 }, 2.76)

  addHighlightSweep(entranceTimeline, 2.68, 0.78)
}

const createReducedMotionTimeline = () => {
  if (!overlay.value || !visual.value || !flipper.value) return

  entranceTimeline = gsap.timeline({ onComplete: completeEntrance })

  if (!hasEntered) {
    entranceTimeline.fromTo(
      overlay.value,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.14, ease: 'none' },
      0,
    )
  }

  entranceTimeline
    .to(eyebrow.value, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'none' }, 0.08)
    .to(visualRing.value, { autoAlpha: 0.6, scale: 1, duration: 0.16, ease: 'none' }, 0.1)
    .to(visual.value, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'none' }, 0.12)

  if (props.event.type === 'level') {
    entranceTimeline
      .to(visual.value, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.46)
      .set(flipper.value, { rotationY: 180 })
      .to(visual.value, { autoAlpha: 1, duration: 0.1, ease: 'none' })
      .to(visual.value, { autoAlpha: 0, duration: 0.1, ease: 'none' }, '+=0.12')
      .call(showNewLevelFront)
      .set(flipper.value, { rotationY: 360 })
      .to(visual.value, { autoAlpha: 1, duration: 0.16, ease: 'none' })
  }

  entranceTimeline
    .to(title.value, { autoAlpha: 1, y: 0, duration: 0.16, ease: 'none' }, '>-0.04')
    .to(description.value, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'none' }, '<0.06')
    .to(continueButton.value, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'none' }, '>-0.02')
}

const playEntrance = () => {
  if (!overlay.value || !content.value || !visual.value || !flipper.value) return

  animationContext?.revert()
  entranceTimeline?.kill()
  exitTween?.kill()

  animationContext = gsap.context(() => {
    gsap.set(content.value, { autoAlpha: 1, y: 0 })
    gsap.set([eyebrow.value, title.value, description.value, continueButton.value], {
      autoAlpha: 0,
      y: 14,
    })
    gsap.set(visualRing.value, { autoAlpha: 0, scale: 0.84 })
    gsap.set(highlight.value, {
      opacity: 0,
      visibility: 'hidden',
      xPercent: -270,
      yPercent: -16,
      rotation: 20,
    })

    if (props.event.type === 'badge' && !isReducedMotion.value) {
      gsap.set(visual.value, { autoAlpha: 0 })
      gsap.set(flipper.value, { rotationY: -630, rotationZ: -4, scale: 0.35 })
    } else {
      gsap.set(visual.value, { autoAlpha: 0, scale: isReducedMotion.value ? 0.88 : 0.82 })
      gsap.set(flipper.value, { rotationY: 0, rotationZ: 0, scale: 1 })
    }

    if (isReducedMotion.value) {
      createReducedMotionTimeline()
    } else if (props.event.type === 'level') {
      createLevelTimeline()
    } else {
      createBadgeTimeline()
    }
  }, overlay.value)

  hasEntered = true
}

const prepareAndPlayEntrance = async () => {
  const requestId = ++preloadRequestId
  isTransitioning.value = true
  setInitialFrontImage()

  try {
    await nextTick()

    animationContext?.revert()
    entranceTimeline?.kill()
    exitTween?.kill()

    if (content.value) {
      gsap.set(content.value, { autoAlpha: 0, y: 0 })
    }

    await Promise.all(getPreloadPaths().map(preloadImage))

    if (requestId !== preloadRequestId || !overlay.value) return

    await nextTick()
    playEntrance()
  } catch (error: unknown) {
    if (requestId !== preloadRequestId) return

    console.error('Failed to play progression animation:', error)
    emit('error')
  }
}

const handleContinue = () => {
  if (isTransitioning.value || !content.value || !overlay.value) return

  isTransitioning.value = true
  const target = props.hasFollowingEvent ? content.value : overlay.value

  try {
    exitTween = gsap.to(target, {
      autoAlpha: 0,
      y: isReducedMotion.value || !props.hasFollowingEvent ? 0 : -12,
      duration: isReducedMotion.value ? 0.1 : 0.18,
      ease: 'power1.in',
      onComplete: () => {
        emit('continue')
      },
    })
  } catch (error: unknown) {
    console.error('Failed to finish progression animation:', error)
    emit('error')
  }
}

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    focusContinueButton()
  }
}

const handleReducedMotionChange = (event: MediaQueryListEvent) => {
  isReducedMotion.value = event.matches
}

watch(
  () => props.eventKey,
  () => {
    if (!hasEntered) return
    void prepareAndPlayEntrance()
  },
  { flush: 'post' },
)

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion.value = reducedMotionQuery.matches
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange)

  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleDocumentKeydown)
  void prepareAndPlayEntrance()
})

onBeforeUnmount(() => {
  preloadRequestId += 1
  animationContext?.revert()
  entranceTimeline?.kill()
  exitTween?.kill()
  reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
  document.body.style.overflow = originalBodyOverflow
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <Teleport to="body">
    <section
      ref="overlay"
      class="progression-overlay"
      :class="`progression-overlay--${event.type}`"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progression-event-title"
      aria-describedby="progression-event-description"
    >
      <article
        ref="content"
        class="progression-event base-card base-card--glass"
        aria-live="polite"
        aria-atomic="true"
      >
        <span class="progression-event__announcement">{{ announcement }}</span>

        <header class="progression-event__header">
          <p ref="eyebrow" class="progression-event__eyebrow">
            <Sparkles :size="16" :stroke-width="2" aria-hidden="true" />
            {{ eventTypeLabel }}
          </p>

          <span v-if="badgeIndex && badgeTotal" class="progression-event__count">
            {{ badgeIndex }} / {{ badgeTotal }}
          </span>
        </header>

        <div
          class="progression-event__visual-stage"
          :class="`progression-event__visual-stage--${event.type}`"
        >
          <span class="progression-overlay__glow" aria-hidden="true" />
          <span ref="visualRing" class="progression-event__ring" aria-hidden="true" />

          <div ref="visual" class="progression-event__badge-scene" aria-hidden="true">
            <div ref="flipper" class="progression-event__badge-flipper">
              <div class="progression-event__badge-face progression-event__badge-front">
                <BadgeImage
                  class="progression-event__badge-image"
                  :name="frontImageName"
                  :image-path="frontImagePath"
                  :unlocked="true"
                />
              </div>

              <div class="progression-event__badge-face progression-event__badge-back">
                <img
                  :src="BADGE_BACK_IMAGE_PATH"
                  alt=""
                  width="512"
                  height="512"
                  decoding="async"
                />
              </div>
            </div>

            <span ref="highlight" class="progression-event__badge-highlight" />
          </div>
        </div>

        <div class="progression-event__copy">
          <h2 id="progression-event-title" ref="title">
            <span v-if="event.type === 'level'" class="progression-event__level-title">
              <span class="progression-event__level-number">Lv.{{ event.toLevel }}</span>
              <span class="progression-event__level-name">{{ event.toName }}</span>
            </span>
            <template v-else>{{ eventTitle }}</template>
          </h2>
          <p id="progression-event-description" ref="description">{{ eventDescription }}</p>
        </div>

        <div ref="continueButton" class="progression-event__button-wrap">
          <BaseButton
            class="progression-event__continue-button"
            :label="buttonLabel"
            icon="pi pi-arrow-right"
            icon-pos="right"
            :disabled="isTransitioning"
            @click="handleContinue"
          />
        </div>
      </article>
    </section>
  </Teleport>
</template>

<style scoped>
.progression-overlay {
  --progression-accent: var(--color-secondary);
  --progression-accent-soft: var(--color-secondary-soft);
  --progression-accent-pale: var(--color-secondary-pale);
  --progression-badge-size: clamp(9.25rem, 32vw, 11rem);

  position: fixed;
  z-index: 3000;
  inset: 0;

  display: grid;
  min-height: 100dvh;
  padding: var(--space-5);
  overflow: hidden auto;
  place-items: center;

  color: var(--color-text);

  background:
    radial-gradient(
      circle at 50% 43%,
      color-mix(in srgb, var(--progression-accent-pale) 48%, transparent) 0 14%,
      transparent 46%
    ),
    color-mix(in srgb, var(--color-primary-soft) 60%, transparent);
}

.progression-overlay--level {
  --progression-accent: var(--color-primary);
  --progression-accent-soft: var(--color-primary-soft);
  --progression-accent-pale: var(--color-primary-pale);
}

.progression-overlay__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 0;

  width: 100%;
  aspect-ratio: 1;

  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--progression-accent-soft) 58%, transparent),
    transparent 67%
  );
  border-radius: var(--radius-full);
  filter: blur(var(--space-3));
  opacity: 0.62;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.progression-event {
  position: relative;
  z-index: 1;

  display: grid;
  width: min(100%, 35rem);
  padding: var(--space-6) var(--space-7);
  justify-items: center;

  text-align: center;

  border-radius: var(--radius-xl);
}

.progression-event__announcement {
  position: absolute;

  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;

  white-space: nowrap;

  clip: rect(0, 0, 0, 0);
  border: 0;
}

.progression-event__header {
  display: flex;
  min-height: 1.75rem;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.progression-event__eyebrow {
  display: inline-flex;
  margin: 0;
  align-items: center;
  gap: var(--space-2);

  color: var(--progression-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
}

.progression-event__count {
  padding: var(--space-1) var(--space-3);

  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-base);

  background: var(--progression-accent-pale);
  border-radius: var(--radius-full);
}

.progression-event__visual-stage {
  position: relative;

  display: grid;
  width: calc(var(--progression-badge-size) + var(--space-5));
  min-height: calc(var(--progression-badge-size) + var(--space-5));
  margin: var(--space-3) 0;
  place-items: center;
}

.progression-event__ring {
  position: absolute;
  z-index: 0;
  inset: var(--space-2);

  border-radius: var(--radius-full);
  box-shadow:
    0 var(--space-2) var(--space-8) color-mix(in srgb, var(--progression-accent) 24%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--progression-accent) 36%, transparent);
}

.progression-event__badge-scene {
  position: relative;
  z-index: 1;

  width: var(--progression-badge-size);
  aspect-ratio: 1;
  overflow: hidden;

  border-radius: var(--radius-full);
  perspective: 68rem;
}

.progression-event__badge-flipper {
  position: relative;

  width: 100%;
  height: 100%;

  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  will-change: transform;
}

.progression-event__badge-face {
  position: absolute;
  inset: 0;

  display: grid;
  overflow: hidden;
  place-items: center;

  border-radius: var(--radius-full);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
}

.progression-event__badge-front {
  transform: rotateY(0deg) translateZ(1px);
}

.progression-event__badge-back {
  transform: rotateY(180deg) translateZ(1px);
}

.progression-event__badge-image {
  --badge-image-size: var(--progression-badge-size);
}

.progression-event__badge-back img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.progression-event__badge-highlight {
  position: absolute;
  z-index: 3;
  top: -40%;
  left: 29%;

  width: 42%;
  height: 180%;

  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--color-surface) 24%, transparent) 24%,
    color-mix(in srgb, var(--color-surface) 96%, transparent) 50%,
    color-mix(in srgb, var(--color-accent-pale) 44%, transparent) 72%,
    transparent 100%
  );
  filter: blur(1px);
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transform: translate3d(-270%, -16%, 0) rotate(20deg);
  transform-origin: center;
}

.progression-event__copy {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
}

.progression-event__level-title {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-3);
}

.progression-event__level-number {
  letter-spacing: var(--letter-spacing-wide);
}

.progression-event__level-name {
  letter-spacing: var(--letter-spacing-base);
}

.progression-event__copy h2 {
  margin: 0;
  overflow-wrap: anywhere;

  color: var(--color-text);
  font-size: clamp(var(--font-size-md), 6vw, var(--font-size-xl));
  line-height: var(--line-height-heading);
}

.progression-event__copy p {
  max-width: 36ch;
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.progression-event__button-wrap {
  margin-top: var(--space-5);
}

.progression-event__button-wrap :deep(.progression-event__continue-button) {
  min-width: calc(var(--space-8) + var(--space-8) + var(--space-6));
  border-radius: var(--radius-full);
}

@media (max-width: 600px) {
  .progression-overlay {
    padding: var(--space-4);
  }

  .progression-event {
    padding: var(--space-5) var(--space-4);
  }

  .progression-overlay {
    --progression-badge-size: min(58vw, 11rem);
  }
}

@media (max-height: 680px) {
  .progression-event {
    padding-block: var(--space-4);
  }

  .progression-overlay {
    --progression-badge-size: min(42vw, 7.25rem);
  }

  .progression-event__visual-stage {
    margin-block: var(--space-2);
  }

  .progression-event__button-wrap {
    margin-top: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progression-event__badge-flipper {
    will-change: auto;
  }
}
</style>
