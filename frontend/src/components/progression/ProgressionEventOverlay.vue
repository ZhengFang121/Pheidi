<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowRight, Medal, Sparkles } from '@lucide/vue'
import gsap from 'gsap'

import type { ProgressionEvent } from '@/types/progressionEvent'

const props = defineProps<{
  event: ProgressionEvent
  eventKey: number
  badgeIndex?: number
  badgeTotal?: number
  hasFollowingEvent: boolean
}>()

const emit = defineEmits<{
  continue: []
}>()

const overlay = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const eyebrow = ref<HTMLElement | null>(null)
const visual = ref<HTMLElement | null>(null)
const visualRing = ref<HTMLElement | null>(null)
const previousLevel = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const description = ref<HTMLElement | null>(null)
const continueButton = ref<HTMLButtonElement | null>(null)

const isReducedMotion = ref(false)
const isTransitioning = ref(false)

let entranceTimeline: gsap.core.Timeline | undefined
let exitTween: gsap.core.Tween | undefined
let hasEntered = false
let originalBodyOverflow = ''

const eventTypeLabel = computed(() => (props.event.type === 'badge' ? '成就解鎖' : '階段提升'))

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

const buttonLabel = computed(() => (props.event.type === 'level' ? '繼續旅程' : '繼續'))

const announcement = computed(() => {
  const progress =
    props.badgeIndex && props.badgeTotal
      ? `，第 ${props.badgeIndex} 枚，共 ${props.badgeTotal} 枚`
      : ''

  return `${eventTypeLabel.value}${progress}：${eventTitle.value}。${eventDescription.value}`
})

const getAnimatedElements = () =>
  [
    eyebrow.value,
    visual.value,
    visualRing.value,
    previousLevel.value,
    title.value,
    description.value,
    continueButton.value,
  ].filter((element): element is HTMLElement => Boolean(element))

const focusContinueButton = () => {
  continueButton.value?.focus({ preventScroll: true })
}

const playEntrance = () => {
  if (!overlay.value || !content.value) return

  entranceTimeline?.kill()
  exitTween?.kill()
  isTransitioning.value = true

  const elements = getAnimatedElements()

  gsap.killTweensOf([overlay.value, content.value, ...elements])
  gsap.set(elements, { clearProps: 'all' })

  if (isReducedMotion.value) {
    gsap.set(elements, { autoAlpha: 0 })

    entranceTimeline = gsap.timeline({
      onComplete: () => {
        isTransitioning.value = false
        focusContinueButton()
      },
    })

    if (!hasEntered) {
      entranceTimeline.fromTo(
        overlay.value,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.12, ease: 'none' },
      )
    }

    entranceTimeline.to(elements, { autoAlpha: 1, duration: 0.14, ease: 'none' })
    hasEntered = true
    return
  }

  gsap.set([eyebrow.value, title.value, description.value, continueButton.value], {
    autoAlpha: 0,
    y: 10,
  })
  gsap.set(visual.value, { autoAlpha: 0, scale: 0.76 })
  gsap.set(visualRing.value, { autoAlpha: 0, scale: 0.82 })

  if (previousLevel.value) {
    gsap.set(previousLevel.value, { autoAlpha: 1, y: 0 })
  }

  entranceTimeline = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => {
      isTransitioning.value = false
      focusContinueButton()
    },
  })

  if (!hasEntered) {
    entranceTimeline.fromTo(
      overlay.value,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.24, ease: 'power1.out' },
    )
  }

  entranceTimeline.to(eyebrow.value, { autoAlpha: 1, y: 0, duration: 0.24 }, hasEntered ? 0 : 0.12)

  if (props.event.type === 'level' && previousLevel.value) {
    entranceTimeline
      .to(previousLevel.value, { autoAlpha: 0, y: -16, duration: 0.26 }, 0.28)
      .to(visualRing.value, { autoAlpha: 0.72, scale: 1, duration: 0.42, ease: 'power2.out' }, 0.36)
      .to(visual.value, { autoAlpha: 1, scale: 1, duration: 0.48, ease: 'back.out(1.45)' }, 0.36)
      .to(title.value, { autoAlpha: 1, y: 0, duration: 0.26 }, 0.6)
      .to(description.value, { autoAlpha: 1, y: 0, duration: 0.26 }, 0.69)
      .to(continueButton.value, { autoAlpha: 1, y: 0, duration: 0.22 }, 0.8)
  } else {
    entranceTimeline
      .to(visualRing.value, { autoAlpha: 0.72, scale: 1, duration: 0.42, ease: 'power2.out' }, 0.18)
      .to(visual.value, { autoAlpha: 1, scale: 1, duration: 0.48, ease: 'back.out(1.45)' }, 0.18)
      .to(title.value, { autoAlpha: 1, y: 0, duration: 0.26 }, 0.5)
      .to(description.value, { autoAlpha: 1, y: 0, duration: 0.26 }, 0.59)
      .to(continueButton.value, { autoAlpha: 1, y: 0, duration: 0.22 }, 0.72)
  }

  hasEntered = true
}

const handleContinue = () => {
  if (isTransitioning.value || !content.value || !overlay.value) return

  isTransitioning.value = true
  const target = props.hasFollowingEvent ? content.value : overlay.value

  exitTween = gsap.to(target, {
    autoAlpha: 0,
    y: isReducedMotion.value || !props.hasFollowingEvent ? 0 : -12,
    duration: isReducedMotion.value ? 0.1 : 0.18,
    ease: 'power1.in',
    onComplete: () => {
      emit('continue')
    },
  })
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

watch(
  () => props.eventKey,
  async () => {
    if (!hasEntered) return

    await nextTick()
    gsap.set(content.value, { clearProps: 'all' })
    playEntrance()
  },
  { flush: 'post' },
)

onMounted(() => {
  isReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  originalBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleDocumentKeydown)
  playEntrance()
})

onBeforeUnmount(() => {
  entranceTimeline?.kill()
  exitTween?.kill()
  document.body.style.overflow = originalBodyOverflow
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <Teleport to="body">
    <section
      ref="overlay"
      class="progression-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progression-event-title"
      aria-describedby="progression-event-description"
    >
      <div
        class="progression-overlay__glow progression-overlay__glow--primary"
        aria-hidden="true"
      />
      <div
        class="progression-overlay__glow progression-overlay__glow--secondary"
        aria-hidden="true"
      />

      <div class="progression-overlay__track" aria-hidden="true">
        <span v-for="index in 4" :key="index" />
      </div>

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
          <p
            v-if="event.type === 'level'"
            ref="previousLevel"
            class="progression-event__previous-level"
          >
            {{ previousLevelLabel }}
          </p>

          <span ref="visualRing" class="progression-event__ring" aria-hidden="true" />

          <div
            ref="visual"
            class="progression-event__seal"
            :class="`progression-event__seal--${event.type}`"
            aria-hidden="true"
          >
            <template v-if="event.type === 'badge'">
              <img v-if="event.imageUrl" :src="event.imageUrl" alt="" />
              <Medal v-else :size="72" :stroke-width="1.45" />
            </template>

            <template v-else>
              <span>Lv.</span>
              <strong>{{ event.toLevel }}</strong>
            </template>
          </div>
        </div>

        <div class="progression-event__copy">
          <h2 id="progression-event-title" ref="title">{{ eventTitle }}</h2>
          <p id="progression-event-description" ref="description">{{ eventDescription }}</p>
        </div>

        <button
          ref="continueButton"
          type="button"
          class="progression-event__button"
          @click="handleContinue"
        >
          {{ buttonLabel }}
          <ArrowRight :size="18" :stroke-width="2.2" aria-hidden="true" />
        </button>
      </article>
    </section>
  </Teleport>
</template>

<style scoped>
.progression-overlay {
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
      circle at 50% 42%,
      color-mix(in srgb, var(--color-surface) 94%, transparent) 0 26%,
      transparent 58%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--color-primary-pale) 74%, var(--color-background)),
      color-mix(in srgb, var(--color-accent-pale) 50%, var(--color-background))
    );
}

.progression-overlay__glow {
  position: absolute;

  width: min(42vw, 560px);
  aspect-ratio: 1;

  border-radius: 50%;
  filter: blur(12px);
  opacity: 0.34;
  pointer-events: none;
}

.progression-overlay__glow--primary {
  top: -18%;
  right: -8%;

  background: radial-gradient(circle, var(--color-primary-soft), transparent 68%);
}

.progression-overlay__glow--secondary {
  bottom: -24%;
  left: -8%;

  background: radial-gradient(circle, var(--color-secondary-soft), transparent 68%);
}

.progression-overlay__track {
  position: absolute;
  top: 50%;
  left: 50%;

  width: min(72vw, 800px);
  aspect-ratio: 2.2;

  border: 1px solid color-mix(in srgb, var(--color-primary) 22%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-7deg);
  pointer-events: none;
}

.progression-overlay__track::before {
  position: absolute;
  inset: var(--space-3);

  border: 1px dashed color-mix(in srgb, var(--color-secondary) 30%, transparent);
  border-radius: inherit;

  content: '';
}

.progression-overlay__track span {
  position: absolute;

  width: 6px;
  aspect-ratio: 1;

  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
}

.progression-overlay__track span:nth-child(1) {
  top: 8%;
  left: 22%;
}

.progression-overlay__track span:nth-child(2) {
  top: 21%;
  right: 12%;
}

.progression-overlay__track span:nth-child(3) {
  right: 24%;
  bottom: 4%;
}

.progression-overlay__track span:nth-child(4) {
  bottom: 15%;
  left: 10%;
}

.progression-event {
  position: relative;
  z-index: 1;

  display: grid;
  width: min(100%, 560px);
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
  min-height: 28px;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.progression-event__eyebrow {
  display: inline-flex;
  margin: 0;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-primary);
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

  background: var(--color-primary-pale);
  border-radius: var(--radius-full);
}

.progression-event__visual-stage {
  position: relative;

  display: grid;
  width: 228px;
  min-height: 228px;
  margin: var(--space-3) 0;
  place-items: center;
}

.progression-event__ring {
  position: absolute;
  inset: 16px;

  border: 1px solid color-mix(in srgb, var(--color-primary) 48%, transparent);
  border-radius: 50%;
  box-shadow:
    0 0 0 12px color-mix(in srgb, var(--color-primary-pale) 42%, transparent),
    0 0 52px color-mix(in srgb, var(--color-primary) 24%, transparent);
}

.progression-event__ring::before,
.progression-event__ring::after {
  position: absolute;

  width: 9px;
  aspect-ratio: 1;

  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: 50%;

  content: '';
}

.progression-event__ring::before {
  top: 19px;
  right: 15px;
}

.progression-event__ring::after {
  bottom: 13px;
  left: 27px;
}

.progression-event__seal {
  position: relative;

  display: grid;
  width: 148px;
  aspect-ratio: 1;
  place-items: center;

  color: var(--color-dark);

  background:
    radial-gradient(circle at 35% 28%, var(--color-surface), transparent 28%),
    linear-gradient(145deg, var(--color-accent-pale), var(--color-secondary-pale));
  border: 2px solid color-mix(in srgb, var(--color-accent) 38%, var(--color-surface));
  border-radius: 50%;
  box-shadow: var(--shadow-md);
}

.progression-event__seal::after {
  position: absolute;
  inset: 10px;

  border: 1px dashed color-mix(in srgb, var(--color-dark) 32%, transparent);
  border-radius: inherit;

  content: '';
}

.progression-event__seal img {
  width: 82%;
  height: 82%;
  object-fit: contain;
}

.progression-event__seal--level {
  align-content: center;
  gap: 0;

  color: var(--color-dark);

  background:
    radial-gradient(circle at 35% 28%, var(--color-surface), transparent 28%),
    linear-gradient(145deg, var(--color-primary-pale), var(--color-secondary-soft));
  border-color: color-mix(in srgb, var(--color-primary) 48%, var(--color-surface));
}

.progression-event__seal--level span {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-base);
  line-height: 1;
}

.progression-event__seal--level strong {
  font-size: 4.5rem;
  letter-spacing: -0.04em;
  line-height: 0.95;
}

.progression-event__previous-level {
  position: absolute;
  z-index: 2;

  margin: 0;
  padding: var(--space-2) var(--space-4);

  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.progression-event__copy {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
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

.progression-event__button {
  display: inline-flex;
  min-width: 160px;
  min-height: 48px;
  margin-top: var(--space-5);
  padding: var(--space-3) var(--space-5);
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  color: var(--color-dark);
  font-family: inherit;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-base);

  cursor: pointer;

  background: var(--color-primary);
  border: 0;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.progression-event__button:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.progression-event__button:active {
  transform: translateY(0) scale(0.98);
}

.progression-event__button:focus-visible {
  outline: 3px solid var(--color-accent-soft);
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .progression-overlay {
    padding: var(--space-4);
  }

  .progression-overlay__track {
    width: 112vw;
  }

  .progression-event {
    padding: var(--space-5) var(--space-4);
  }

  .progression-event__visual-stage {
    width: 196px;
    min-height: 196px;
  }

  .progression-event__seal {
    width: 128px;
  }

  .progression-event__ring {
    inset: 12px;
  }
}

@media (max-height: 680px) {
  .progression-event {
    padding-block: var(--space-4);
  }

  .progression-event__visual-stage {
    width: 174px;
    min-height: 174px;
    margin-block: var(--space-2);
  }

  .progression-event__seal {
    width: 116px;
  }

  .progression-event__button {
    margin-top: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progression-event__button {
    transition: none;
  }
}
</style>
