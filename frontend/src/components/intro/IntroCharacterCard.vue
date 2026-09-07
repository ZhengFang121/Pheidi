<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'

type Placement = 'left' | 'right'
type PlacementDistance = 'default' | 'wide'
type HitArea = 'full' | 'beginner' | 'pheidi' | 'ally'
type CharacterColor = 'primary' | 'secondary' | 'accent'

const props = withDefaults(
  defineProps<{
    name: string
    englishName: string
    description: string
    portrait: string
    image: string
    imageAlt: string
    imageClass?: string
    placement?: Placement
    placementDistance?: PlacementDistance
    hitArea?: HitArea
    color?: CharacterColor
  }>(),
  {
    imageClass: '',
    placement: 'right',
    placementDistance: 'default',
    hitArea: 'full',
    color: 'primary',
  },
)

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const popoverStyle = ref<Record<string, string>>({})
const popoverId = `intro-character-${props.englishName.toLowerCase().replace(/\s+/g, '-')}`
let closeTimer: number | undefined
let popoverTween: gsap.core.Tween | undefined
let hoverTween: gsap.core.Tween | undefined
let reducedMotionQuery: MediaQueryList | undefined

function clearCloseTimer() {
  if (closeTimer !== undefined) window.clearTimeout(closeTimer)
  closeTimer = undefined
}

function updatePosition() {
  if (!trigger.value || !popover.value) return

  const triggerRect = trigger.value.getBoundingClientRect()
  const cardRect = popover.value.getBoundingClientRect()
  const baseSpace = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const viewportGap = baseSpace
  const anchorGap = props.placementDistance === 'wide' ? baseSpace * 6 : baseSpace
  const roomRight = window.innerWidth - triggerRect.right - viewportGap
  const roomLeft = triggerRect.left - viewportGap
  const useRight =
    props.placement === 'right'
      ? roomRight >= Math.min(cardRect.width, 288) || roomRight >= roomLeft
      : !(roomLeft >= Math.min(cardRect.width, 288) || roomLeft >= roomRight)

  let left = useRight
    ? triggerRect.right + anchorGap
    : triggerRect.left - cardRect.width - anchorGap
  left = Math.min(Math.max(left, viewportGap), window.innerWidth - cardRect.width - viewportGap)

  let top = triggerRect.top + (triggerRect.height - cardRect.height) / 2
  top = Math.min(Math.max(top, viewportGap), window.innerHeight - cardRect.height - viewportGap)

  popoverStyle.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  }
}

async function open() {
  clearCloseTimer()
  if (isOpen.value) return
  isOpen.value = true
  await nextTick()
  updatePosition()
  if (!popover.value) return

  popoverTween?.kill()
  if (reducedMotionQuery?.matches) {
    gsap.set(popover.value, { autoAlpha: 1, y: 0, scale: 1 })
    return
  }
  popoverTween = gsap.fromTo(
    popover.value,
    { autoAlpha: 0, y: 8, scale: 0.98 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: 'power2.out', overwrite: true },
  )
}

function close(restoreFocus = false) {
  clearCloseTimer()
  if (!isOpen.value) return

  const finish = () => {
    isOpen.value = false
    if (restoreFocus) trigger.value?.focus()
  }

  if (!popover.value || reducedMotionQuery?.matches) {
    finish()
    return
  }
  popoverTween?.kill()
  popoverTween = gsap.to(popover.value, {
    autoAlpha: 0,
    y: 6,
    scale: 0.98,
    duration: 0.18,
    ease: 'power2.in',
    overwrite: true,
    onComplete: finish,
  })
}

function toggle() {
  if (isOpen.value) close()
  else void open()
}

function scheduleClose() {
  clearCloseTimer()
  const delay = props.placementDistance === 'wide' ? 320 : 100
  closeTimer = window.setTimeout(() => close(), delay)
}

function handlePointerEnter() {
  clearCloseTimer()
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) void open()

  if (!trigger.value || reducedMotionQuery?.matches) return
  hoverTween?.kill()
  hoverTween = gsap.to(trigger.value, {
    scale: 1.02,
    duration: 0.12,
    ease: 'power2.out',
    overwrite: true,
  })
}

function handlePointerLeave() {
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) scheduleClose()
  if (!trigger.value || reducedMotionQuery?.matches) return
  hoverTween?.kill()
  hoverTween = gsap.to(trigger.value, {
    scale: 1,
    duration: 0.18,
    ease: 'power2.out',
    overwrite: true,
  })
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (root.value?.contains(target) || popover.value?.contains(target)) return
  close()
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    event.stopPropagation()
    close(true)
  }
}

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  window.addEventListener('resize', updatePosition)
})

onBeforeUnmount(() => {
  clearCloseTimer()
  popoverTween?.kill()
  hoverTween?.kill()
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div ref="root" class="intro-character">
    <img :src="image" :alt="imageAlt" class="intro-character__image" :class="imageClass" />
    <button
      ref="trigger"
      type="button"
      class="intro-character__trigger"
      :class="`intro-character__trigger--${hitArea}`"
      :aria-label="`查看${name}角色介紹`"
      :aria-expanded="isOpen"
      :aria-controls="popoverId"
      @click.stop="toggle"
      @pointerenter="handlePointerEnter"
      @pointerleave="handlePointerLeave"
    >
      <span class="sr-only">查看{{ name }}角色介紹</span>
    </button>

    <Teleport to="body">
      <aside
        v-if="isOpen"
        :id="popoverId"
        ref="popover"
        class="intro-character-card base-card--glass"
        :class="`intro-character-card--${color}`"
        :style="popoverStyle"
        role="region"
        :aria-label="`${name}角色介紹`"
        @click.stop
        @pointerenter="clearCloseTimer"
        @pointerleave="scheduleClose"
      >
        <span class="intro-character-card__portrait" aria-hidden="true">
          <img :src="portrait" alt="" />
        </span>
        <p class="intro-character-card__eyebrow" lang="en">{{ englishName }}</p>
        <h2 class="intro-character-card__title">{{ name }}</h2>
        <p class="intro-character-card__description">{{ description }}</p>
      </aside>
    </Teleport>
  </div>
</template>

<style scoped>
.intro-character {
  pointer-events: none;
}

.intro-character__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.intro-character__image.pheidi--reveal {
  visibility: hidden;
  opacity: 0;
}

.intro-character__trigger {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 0;
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
  transform-origin: center;
}

.intro-character__trigger--beginner {
  inset: 16% 31% 14%;
}

.intro-character__trigger--pheidi {
  inset: 7% 45% 69%;
}

.intro-character__trigger--ally {
  inset: 14% 14% 22% 50%;
}

.intro-character__trigger:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: var(--space-1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
}
</style>

<style>
.intro-character-card {
  --intro-character-color: var(--color-primary);

  position: fixed;
  z-index: 20;
  width: min(18rem, calc(100vw - (var(--space-6) * 2)));
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  color: var(--color-text);
  font-family: var(--font-family-base);
  pointer-events: auto;
  transform-origin: center;
  will-change: transform, opacity;
}

.intro-character-card--secondary {
  --intro-character-color: var(--color-secondary);
}

.intro-character-card--primary {
  --intro-character-color: var(--color-primary-pale);
}

.intro-character-card--accent {
  --intro-character-color: var(--color-accent);
}

.intro-character-card__portrait {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  z-index: 1;
  width: calc(var(--space-8) + var(--space-6));
  height: calc(var(--space-8) + var(--space-6));
  overflow: hidden;
  pointer-events: none;
}

.intro-character-card__portrait img {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc((var(--space-8) * 2) + var(--space-5) + var(--space-4));
  max-width: none;
  height: auto;
  transform: translate(-50%, -50%);
}

.intro-character-card--primary .intro-character-card__portrait img {
  transform: translate(-50%, -50%) translateY(var(--space-1));
}

.intro-character-card--secondary .intro-character-card__portrait img {
  width: calc((var(--space-8) * 3) + var(--space-6));
  transform: translate(-50%, -50%) translateY(calc(var(--space-3) * -1));
}

.intro-character-card--accent .intro-character-card__portrait img {
  width: calc((var(--space-8) * 2) + var(--space-6) + var(--space-1));
}

.intro-character-card__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--intro-character-color);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-wide);
  white-space: nowrap;
}

.intro-character-card--accent .intro-character-card__eyebrow {
  font-kerning: none;
  font-variant-ligatures: none;
  letter-spacing: calc(var(--letter-spacing-wide) * 1.5);
}

.intro-character-card__title {
  max-width: calc(100% - var(--space-8) - var(--space-7));
  margin: 0 0 var(--space-3);
  color: var(--intro-character-color);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-base);
}

.intro-character-card__description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  white-space: pre-line;
}

@media (max-width: 640px) {
  .intro-character-card {
    width: min(17rem, calc(100vw - (var(--space-5) * 2)));
    padding: var(--space-4);
  }

  .intro-character-card__portrait {
    top: var(--space-2);
    right: var(--space-2);
    width: calc(var(--space-8) + var(--space-5));
    height: calc(var(--space-8) + var(--space-5));
  }

  .intro-character-card__portrait img {
    width: calc((var(--space-8) * 2) + var(--space-3));
  }

  .intro-character-card--secondary .intro-character-card__portrait img {
    width: calc((var(--space-8) * 2) + var(--space-7) + var(--space-2));
    transform: translate(-50%, -50%) translateY(calc(var(--space-2) * -1));
  }

  .intro-character-card--accent .intro-character-card__portrait img {
    width: calc((var(--space-8) * 2) + var(--space-2));
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro-character-card {
    will-change: auto;
  }
}
</style>
