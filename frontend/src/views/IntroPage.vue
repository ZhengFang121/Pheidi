<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type IntroScene = {
  id: number
  text: string
}

const scenes: IntroScene[] = [
  {
    id: 1,
    text: '在《跑者菲迪 Pheidi the Runner》的世界裡有一位傳說中的跑者－菲迪 Pheidi',
  },
  {
    id: 2,
    text: '他完成了一段至今無人能超越的跑者旅程',
  },
  {
    id: 3,
    text: '請踏上追尋菲迪的旅程吧！',
  },
]

const totalSteps = 8

// 0 是 Logo 入口，1～3 是文字故事，4～8 是掉落場景。
const currentStep = ref(0)
const isChanging = ref(false)
const touchStartY = ref(0)

const currentScene = computed(() => scenes[currentStep.value - 1] ?? scenes[0])
const isStoryVisible = computed(() => currentStep.value >= 1 && currentStep.value <= 3)
const isFallingVisible = computed(() => currentStep.value >= 4)
const isDarkScene = computed(() => currentStep.value >= 4)
const fallingImage = computed(() => {
  if (currentStep.value <= 6) return '/images/intro/falling-1.png'
  if (currentStep.value === 7) return '/images/intro/falling-2.png'
  return '/images/intro/falling-3.png'
})

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
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
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
        <Transition name="text-fade" mode="out-in">
          <p :key="currentScene.id" class="story-text">{{ currentScene.text }}</p>
        </Transition>

        <img
          src="/images/intro/walking.png"
          alt="跑者一邊看著手機一邊前進"
          class="runner-animation"
        />
      </section>

      <section
        v-else-if="isFallingVisible"
        key="falling"
        class="falling-scene"
        :aria-label="`掉落場景第 ${currentStep - 3} 段，共 5 段`"
      >
        <img
          src="/images/intro/light.png"
          alt=""
          class="falling-light"
          :class="{ 'falling-light--visible': currentStep >= 5 }"
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
  gap: clamp(48px, 7vh, 72px);
  transform: translateY(-4vh);
}

.intro-logo {
  width: clamp(300px, 30vw, 400px);
  height: auto;
  transform: translateX(-18%);
}

.corner-logo {
  position: absolute;
  bottom: clamp(24px, 3vw, 48px);
  left: clamp(24px, 3vw, 48px);
  z-index: 2;
  width: clamp(64px, 6vw, 100px);
  height: auto;
  opacity: 0.5;
}

.login-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  min-height: 60px;
  padding: 12px 32px;
  color: var(--color-background);
  font-family: var(--font-family-base);
  font-size: 24px;
  font-weight: var(--font-weight-regular);
  line-height: 1;
  letter-spacing: 0.2em;
  text-decoration: none;
  text-transform: uppercase;
  background: var(--color-primary);
  border-radius: 999px;
  transition:
    background-color 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease;
}

.login-link:hover {
  background: var(--color-accent);
  box-shadow: 0 8px 20px rgb(60 67 94 / 12%);
  transform: translateY(-2px);
}

.login-link:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 4px;
}

.story-scene {
  width: min(100%, 1120px);
  transform: translateY(-1vh);
}

.story-text {
  min-height: 2em;
  margin: 0 0 clamp(72px, 11vh, 120px);
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: clamp(18px, 1.7vw, 24px);
  font-weight: var(--font-weight-bold);
  line-height: 1.7;
  letter-spacing: 0.1em;
  text-align: center;
  text-wrap: balance;
}

.runner-animation {
  width: clamp(280px, 28vw, 400px);
  height: auto;
  object-fit: contain;
  animation: runner-walk 1.2s ease-in-out infinite;
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

.falling-runner--step-4 {
  opacity: 0;
  transform: translate(-50%, -150vh) scale(0.2);
}

.falling-runner--step-5 {
  transform: translate(-50%, -58vh) scale(0.28);
}

.falling-runner--step-6 {
  transform: translate(-50%, -40vh) scale(0.82);
}

.falling-runner--step-7 {
  transform: translate(-50%, -12vh) scale(0.95);
}

.falling-runner--step-8 {
  transform: translate(-50%, 18vh) scale(1.08);
}

.scroll-hint {
  position: absolute;
  bottom: clamp(32px, 5vh, 56px);
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
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
  border-radius: 999px;
}

.mouse-wheel {
  width: 2px;
  height: 10px;
  background: currentcolor;
  border-radius: 999px;
  animation: scroll-wheel 1.8s ease-in-out infinite;
}

.scroll-text {
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
}

.scroll-hint--dark {
  color: rgb(255 255 255 / 72%);
}

.scene-progress {
  position: absolute;
  top: 50%;
  right: clamp(24px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translateY(-50%);
}

.progress-dot {
  width: 8px;
  height: 8px;
  background: color-mix(in srgb, var(--color-primary) 35%, transparent);
  border-radius: 50%;
  transition:
    height 300ms ease,
    background-color 300ms ease;
}

.progress-dot--active {
  height: 28px;
  background: var(--color-primary);
  border-radius: 999px;
}

.intro-fade-enter-active,
.intro-fade-leave-active {
  transition:
    opacity 450ms ease,
    transform 450ms ease;
}

.intro-fade-enter-from {
  opacity: 0;
  transform: translateY(24px);
}

.intro-fade-leave-to {
  opacity: 0;
  transform: translateY(-24px);
}

.text-fade-enter-active,
.text-fade-leave-active {
  transition:
    opacity 350ms ease,
    transform 350ms ease;
}

.text-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.text-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
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

@keyframes runner-walk {
  0%,
  100% {
    transform: translateY(0) rotate(-0.5deg);
  }

  50% {
    transform: translateY(-5px) rotate(0.5deg);
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
    min-width: 156px;
    min-height: 52px;
    font-size: 20px;
  }

  .story-scene {
    transform: translateY(-4vh);
  }

  .story-text {
    min-height: 5em;
    margin-bottom: 48px;
    font-size: 17px;
  }

  .runner-animation {
    width: min(260px, 68vw);
  }

  .falling-runner {
    width: min(620px, 92vw);
  }

  .scroll-hint {
    bottom: 24px;
    gap: 12px;
  }

  .mouse-icon {
    width: 30px;
    height: 44px;
    padding-top: 8px;
  }

  .scroll-text {
    font-size: 11px;
  }

  .scene-progress {
    right: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mouse-wheel,
  .runner-animation {
    animation: none;
  }

  .login-link,
  .progress-dot,
  .intro-fade-enter-active,
  .intro-fade-leave-active,
  .text-fade-enter-active,
  .text-fade-leave-active,
  .intro-page,
  .falling-light,
  .falling-runner {
    transition: none;
  }
}
</style>
