<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type IntroScene = {
  id: number
  text: string
  image: string
  imageAlt: string
}

const scenes: IntroScene[] = [
  {
    id: 1,
    text: '在《跑者菲迪 Pheidi the Runner》的世界裡有一位傳說中的跑者－菲迪 Pheidi',
    image: '/images/intro/walking.png',
    imageAlt: '跑者一邊看著手機一邊前進',
  },
  {
    id: 2,
    text: '他完成了一段至今無人能超越的跑者旅程',
    image: '/images/intro/walking.png',
    imageAlt: '跑者一邊看著手機一邊前進',
  },
  {
    id: 3,
    text: '請踏上追尋菲迪的旅程吧！',
    image: '/images/intro/falling-1.png',
    imageAlt: '跑者意外掉進神祕的洞口',
  },
  {
    id: 4,
    text: '請踏上追尋菲迪的旅程吧！',
    image: '/images/intro/falling-2.png',
    imageAlt: '跑者消失在神祕的洞口中',
  },
]

const todayDisplay = ref('')
const todayDateTime = ref('')
let dateUpdateTimer: number | undefined

const totalSteps = 7

// 0 是 Logo 入口，1～4 是菲迪日報，5～7 是掉落場景。
const currentStep = ref(0)
const isChanging = ref(false)
const touchStartY = ref(0)

const currentScene = computed(() => scenes[currentStep.value - 1] ?? scenes[0])
const isStoryVisible = computed(() => currentStep.value >= 1 && currentStep.value <= 4)
const isFallingVisible = computed(() => currentStep.value >= 5)
const isDarkScene = computed(() => currentStep.value >= 5)
const fallingImage = computed(() => {
  if (currentStep.value === 5) return '/images/intro/falling-3.png'
  if (currentStep.value === 6) return '/images/intro/falling-4.png'
  return '/images/intro/falling-5.png'
})

function updateToday() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentDay = String(now.getDate()).padStart(2, '0')

  todayDisplay.value = `${currentYear}.${currentMonth}.${currentDay}`
  todayDateTime.value = `${currentYear}-${currentMonth}-${currentDay}`
}

function changeStep(direction: 1 | -1) {
  if (isChanging.value) return

  const nextStep = Math.min(Math.max(currentStep.value + direction, 0), totalSteps)

  if (nextStep === currentStep.value) return

  currentStep.value = nextStep
  isChanging.value = true

  window.setTimeout(() => {
    isChanging.value = false
  }, 700)
}

function handleWheel(event: WheelEvent) {
  if (Math.abs(event.deltaY) < 10) return
  changeStep(event.deltaY > 0 ? 1 : -1)
}

function handleKeydown(event: KeyboardEvent) {
  if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault()
    changeStep(1)
  }

  if (['ArrowUp', 'PageUp'].includes(event.key)) {
    event.preventDefault()
    changeStep(-1)
  }
}

function handleTouchStart(event: TouchEvent) {
  touchStartY.value = event.touches[0]?.clientY ?? 0
}

function handleTouchEnd(event: TouchEvent) {
  const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY.value
  const distance = touchStartY.value - touchEndY

  if (Math.abs(distance) < 50) return
  changeStep(distance > 0 ? 1 : -1)
}

onMounted(() => {
  updateToday()
  dateUpdateTimer = window.setInterval(updateToday, 60_000)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (dateUpdateTimer !== undefined) {
    window.clearInterval(dateUpdateTimer)
  }

  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main
    class="intro-page"
    :class="{ 'intro-page--dark': isDarkScene }"
    aria-live="polite"
    @wheel.prevent="handleWheel"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <h1 class="sr-only">跑者菲迪 Pheidi the Runner</h1>

    <Transition name="intro-fade" mode="out-in">
      <section v-if="currentStep === 0" key="landing" class="intro-content">
        <img src="/logo-1.svg" alt="跑者菲迪 Pheidi the Runner" class="intro-logo" />

        <RouterLink to="/login" class="login-link">Login</RouterLink>
      </section>

      <section
        v-else-if="isStoryVisible"
        key="story"
        class="story-scene"
        :aria-label="`故事第 ${currentScene.id} 段，共 ${scenes.length} 段`"
      >
        <header class="daily-header">
          <h2 class="daily-header__title">菲迪日報</h2>
          <time class="daily-header__date" :datetime="todayDateTime">
            {{ todayDisplay }}
          </time>
        </header>

        <div class="daily-divider" aria-hidden="true"></div>

        <Transition name="text-fade" mode="out-in">
          <p :key="currentScene.id" class="story-text">{{ currentScene.text }}</p>
        </Transition>

        <div class="story-visual">
          <Transition name="illustration-fall">
            <img
              :key="currentScene.image"
              :src="currentScene.image"
              :alt="currentScene.imageAlt"
              class="story-illustration"
              :class="{ 'story-illustration--falling': currentScene.id >= 3 }"
            />
          </Transition>
        </div>
      </section>

      <section
        v-else-if="isFallingVisible"
        key="falling"
        class="falling-scene"
        :aria-label="`掉落場景第 ${currentStep - 4} 段，共 3 段`"
      >
        <img
          src="/images/intro/light.png"
          alt=""
          class="falling-light"
          :class="{ 'falling-light--visible': currentStep >= 6 }"
          aria-hidden="true"
        />

        <img
          :src="fallingImage"
          alt="跑者持續往黑暗深處掉落"
          class="falling-runner"
          :class="`falling-runner--step-${currentStep}`"
        />
      </section>
    </Transition>

    <img
      v-if="currentStep > 0"
      src="/logo-2.svg"
      alt="跑者菲迪 Pheidi the Runner"
      class="corner-logo"
    />

    <div
      v-if="currentStep < totalSteps"
      class="scroll-hint"
      :class="{ 'scroll-hint--dark': isDarkScene }"
      aria-hidden="true"
    >
      <span class="mouse-icon"><span class="mouse-wheel"></span></span>
      <span class="scroll-text">Scroll to play</span>
    </div>

    <div v-if="currentStep > 0" class="scene-progress" aria-hidden="true">
      <span
        v-for="step in totalSteps"
        :key="step"
        class="progress-dot"
        :class="{ 'progress-dot--active': step === currentStep }"
      ></span>
    </div>
  </main>
</template>

<style scoped>
.intro-page {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100svh;
  padding: var(--space-4);
  overflow: hidden;
  overscroll-behavior: none;
  background: var(--color-primary-pale);
  touch-action: pan-y;
  transition: background-color 700ms ease;
}

.intro-page--dark {
  background: var(--color-dark);
}

.intro-content,
.story-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.intro-content {
  gap: clamp(var(--space-7), 7vh, 4.5rem);
  transform: translateY(-4vh);
}

.intro-logo {
  width: clamp(300px, 30vw, 400px);
  height: auto;
  transform: translateX(-20%);
}

.corner-logo {
  position: absolute;
  bottom: clamp(var(--space-5), 3vw, var(--space-7));
  left: clamp(var(--space-5), 3vw, var(--space-7));
  z-index: 2;
  width: clamp(64px, 6vw, 100px);
  height: auto;
  opacity: 0.5;
}

.login-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  min-height: 45px;
  padding: var(--space-2) var(--space-5);
  color: var(--color-background);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: 1;
  letter-spacing: var(--letter-spacing-wide);
  text-decoration: none;
  text-transform: uppercase;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition:
    background-color 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease;
}

.login-link:hover {
  background: var(--color-accent);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.login-link:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: var(--space-1);
}

.story-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.daily-header {
  position: absolute;
  top: clamp(var(--space-7), 12vh, 7.5rem);
  left: 50%;
  width: min(calc(100% - (var(--space-6) * 2)), 56rem);
  text-align: center;
  transform: translateX(-50%);
}

.daily-header__title {
  margin: 0;
  color: var(--color-primary-soft);
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-base);
}

.daily-header__date {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-primary-soft);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-wide);
}

.daily-divider {
  position: absolute;
  top: clamp(8.75rem, 23vh, 14.5rem);
  left: 50%;
  width: min(100%, 56rem);
  height: 1px;
  background-color: var(--color-primary-soft);
  transform: translateX(-50%);
}

.story-text {
  position: absolute;
  top: clamp(12rem, 30vh, 19rem);
  left: 50%;
  width: min(calc(100% - (var(--space-6) * 2)), 48rem);
  min-height: 2em;
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: clamp(1.125rem, 1.7vw, var(--font-size-md));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  text-align: center;
  text-wrap: balance;
  transform: translateX(-50%);
}

.story-visual {
  position: absolute;
  top: 43%;
  left: 50%;
  width: min(52vw, 47.5rem);
  height: min(42vh, 26rem);
  transform: translateX(-50%);
}

.story-illustration {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(280px, 28vw, 400px);
  height: auto;
  object-fit: contain;
  transform: translate(-50%, -50%);
}

.story-illustration--falling {
  width: clamp(560px, 58vw, 760px);
  transform: translate(-50%, -58%);
}

.falling-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.falling-light {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 900ms ease;
}

.falling-light--visible {
  opacity: 0.62;
}

.falling-runner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(360px, 48vw, 680px);
  height: auto;
  opacity: 1;
  will-change: transform, opacity;
  transition:
    transform 1100ms cubic-bezier(0.22, 0.75, 0.3, 1),
    opacity 500ms ease;
}

.falling-runner--step-5 {
  transform: translate(-50%, -38vh) scale(0.72);
}

.falling-runner--step-6 {
  transform: translate(-50%, -10vh) scale(0.9);
}

.falling-runner--step-7 {
  transform: translate(-50%, 18vh) scale(1.08);
}

.scroll-hint {
  position: absolute;
  bottom: clamp(var(--space-6), 5vh, 3.5rem);
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-primary-light);
  transform: translateX(-50%);
}

.mouse-icon {
  display: flex;
  justify-content: center;
  width: 32px;
  height: 48px;
  padding-top: 6px;
  border: 2px solid currentcolor;
  border-radius: var(--radius-full);
}

.mouse-wheel {
  width: 2px;
  height: 10px;
  background: currentcolor;
  border-radius: var(--radius-full);
  animation: scroll-wheel 1.8s ease-in-out infinite;
}

.scroll-text {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: 1;
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  white-space: nowrap;
}

.scroll-hint--dark {
  color: rgb(255 255 255 / 72%);
}

.scene-progress {
  position: absolute;
  top: 50%;
  right: clamp(var(--space-5), 4vw, 3.5rem);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transform: translateY(-50%);
}

.progress-dot {
  width: var(--space-2);
  height: var(--space-2);
  background: color-mix(in srgb, var(--color-primary) 35%, transparent);
  border-radius: 50%;
  transition:
    height 300ms ease,
    background-color 300ms ease;
}

.progress-dot--active {
  height: 28px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.intro-fade-enter-active,
.intro-fade-leave-active {
  transition:
    opacity 450ms ease,
    transform 450ms ease;
}

.intro-fade-enter-from {
  opacity: 0;
  transform: translateY(var(--space-5));
}

.intro-fade-leave-to {
  opacity: 0;
  transform: translateY(calc(var(--space-5) * -1));
}

.text-fade-enter-active,
.text-fade-leave-active {
  transition:
    opacity 350ms ease,
    transform 350ms ease;
}

.text-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, var(--space-3));
}

.text-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(var(--space-3) * -1));
}

.illustration-fall-enter-active,
.illustration-fall-leave-active {
  transition:
    opacity 700ms ease,
    transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
}

.illustration-fall-enter-from {
  opacity: 0;
  transform: translate(-50%, -95%) scale(0.9);
}

.illustration-fall-leave-to {
  opacity: 0;
  transform: translate(-50%, 15%) scale(0.78);
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

@keyframes scroll-wheel {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(10px);
  }
}

@media (max-width: 640px) {
  .intro-page {
    padding: var(--space-3);
  }

  .intro-content {
    gap: 40px;
    transform: translateY(-7vh);
  }

  .intro-logo {
    width: min(260px, 72vw);
  }

  .corner-logo {
    bottom: 20px;
    left: 20px;
    width: 64px;
  }

  .login-link {
    min-width: 90px;
    min-height: 35px;
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
  }

  .story-scene {
    inset: 0;
  }

  .story-text {
    top: clamp(11rem, 28vh, 15rem);
    width: calc(100% - (var(--space-5) * 2));
    min-height: 4em;
    font-size: 17px;
  }

  .daily-header {
    top: var(--space-7);
    width: calc(100% - (var(--space-5) * 2));
  }

  .daily-header__title {
    font-size: var(--font-size-md);
  }

  .daily-header__date {
    font-size: var(--font-size-sm);
  }

  .daily-divider {
    top: 8.5rem;
    width: calc(100% - (var(--space-5) * 2));
  }

  .story-visual {
    top: 45%;
    width: 100%;
    height: 36vh;
  }

  .story-illustration {
    width: min(260px, 68vw);
  }

  .story-illustration--falling {
    width: min(520px, 120vw);
    transform: translate(-50%, -58%);
  }

  .falling-runner {
    width: min(620px, 92vw);
  }

  .scroll-hint {
    bottom: var(--space-5);
    gap: var(--space-3);
  }

  .mouse-icon {
    width: 30px;
    height: 44px;
    padding-top: var(--space-2);
  }

  .scroll-text {
    font-size: 11px;
  }

  .scene-progress {
    right: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mouse-wheel,
  .story-illustration {
    animation: none;
  }

  .login-link,
  .progress-dot,
  .intro-fade-enter-active,
  .intro-fade-leave-active,
  .text-fade-enter-active,
  .text-fade-leave-active,
  .illustration-fall-enter-active,
  .illustration-fall-leave-active,
  .intro-page,
  .falling-light,
  .falling-runner {
    transition: none;
  }
}
</style>
