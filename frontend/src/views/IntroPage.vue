<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import BaseButton from '@/components/base/BaseButton.vue'

type IntroScene = {
  id: number
  text?: string
  tone?: 'primary' | 'runner'
  showDaily?: boolean
  layers: Array<{ image: string; alt?: string; className: string }>
}

const imagePath = (fileName: string) => `/images/intro/${fileName}`

const scenes: IntroScene[] = [
  {
    id: 1,
    text: '在《跑者菲迪 Pheidi the Runner》的世界裡\n有一位神祕的傳奇跑者 - 菲迪 Pheidi',
    showDaily: true,
    layers: [
      { image: imagePath('working.png'), alt: '跑者一邊看著手機一邊前進', className: 'working' },
    ],
  },
  {
    id: 2,
    text: '傳說中，他完成了一段至今無人能超越的跑者旅程',
    showDaily: true,
    layers: [
      { image: imagePath('working.png'), alt: '跑者一邊看著手機一邊前進', className: 'working' },
    ],
  },
  {
    id: 3,
    text: '許多人聽聞後紛紛踏上追尋菲迪的旅程 …',
    showDaily: true,
    layers: [
      { image: imagePath('working.png'), alt: '跑者一邊看著手機一邊前進', className: 'working' },
    ],
  },
  {
    id: 4,
    text: '「咦？」',
    tone: 'runner',
    layers: [{ image: imagePath('what.png'), alt: '跑者突然察覺異狀', className: 'what' }],
  },
  {
    id: 5,
    text: '「啊！」',
    tone: 'runner',
    layers: [
      { image: imagePath('falling-1.1.png'), alt: '跑者失足掉入洞口', className: 'falling-one' },
    ],
  },
  {
    id: 6,
    layers: [{ image: imagePath('falling-1.2.png'), alt: '神祕的洞口', className: 'hole' }],
  },
  {
    id: 7,
    layers: [
      { image: imagePath('falling-2.1.png'), alt: '硬幣往黑暗深處落下', className: 'coins' },
    ],
  },
  {
    id: 8,
    layers: [
      {
        image: imagePath('falling-2.2.png'),
        alt: '跑者掉入光束中',
        className: 'falling-two falling-sequence falling-sequence--start',
      },
    ],
  },
  {
    id: 10,
    layers: [
      {
        image: imagePath('falling-2.2.png'),
        alt: '跑者開始往下墜落',
        className: 'falling-two falling-sequence falling-sequence--start',
      },
      {
        image: imagePath('falling-2.4.png'),
        alt: '跑者落到光束底部',
        className: 'falling-two falling-sequence falling-sequence--end',
      },
    ],
  },
  {
    id: 11,
    text: '「這是哪裡？！」',
    tone: 'runner',
    layers: [{ image: imagePath('look-1.png'), alt: '跑者坐起來四處張望', className: 'look-one' }],
  },
  {
    id: 12,
    text: '「是誰？！」',
    tone: 'runner',
    layers: [{ image: imagePath('look-2.png'), alt: '跑者望向前方', className: 'look-two' }],
  },
  {
    id: 13,
    text: '「菲迪？！」',
    tone: 'runner',
    layers: [
      { image: imagePath('look-2.png'), alt: '跑者望向傳奇跑者菲迪', className: 'look-two' },
      {
        image: imagePath('pheidi.png'),
        alt: '傳奇跑者菲迪出現在前方',
        className: 'pheidi pheidi--reveal',
      },
    ],
  },
  {
    id: 14,
    text: '「嘿，新手跑者\n對! 就是你」',
    layers: [
      { image: imagePath('look-2.png'), alt: '跑者聽著菲迪說話', className: 'look-two' },
      { image: imagePath('pheidi.png'), alt: '傳奇跑者菲迪', className: 'pheidi' },
    ],
  },
  {
    id: 15,
    text: '「來追尋我吧！\n我的追隨者 - 阿里會陪你開始伴你成長的!\n開始來追尋我吧 …」',
    layers: [
      { image: imagePath('look-2.png'), alt: '跑者聽著菲迪的邀請', className: 'look-two' },
      { image: imagePath('pheidi.png'), alt: '傳奇跑者菲迪', className: 'pheidi' },
    ],
  },
  {
    id: 16,
    text: '「菲迪!!」',
    tone: 'runner',
    layers: [{ image: imagePath('look-2.png'), alt: '跑者呼喊菲迪', className: 'look-two' }],
  },
  {
    id: 17,
    text: '「好！開始跑吧！」',
    tone: 'runner',
    layers: [
      {
        image: imagePath('running-1.png'),
        alt: '跑者踏出第一步',
        className: 'running running--new-runner',
      },
    ],
  },
  {
    id: 18,
    text: '「我們一起跑吧！」',
    layers: [
      {
        image: imagePath('running-2.png'),
        alt: '跑者與夥伴阿里一起奔跑',
        className: 'running',
      },
    ],
  },
]

const todayDisplay = ref('')
const todayDateTime = ref('')
const currentStep = ref(0)
const isChanging = ref(false)
const touchStartY = ref(0)
const mainPage = ref<HTMLElement | null>(null)
const mouseWheel = ref<HTMLElement | null>(null)
const storyText = ref<HTMLElement | null>(null)
const portalTransition = ref<HTMLElement | null>(null)
const portalCurtain = ref<HTMLElement | null>(null)
const portalHole = ref<HTMLImageElement | null>(null)
let dateUpdateTimer: number | undefined
let changeStepTimer: number | undefined
let portalSequenceTimer: number | undefined
let scrollHintTween: gsap.core.Tween | undefined
let portalTimeline: gsap.core.Timeline | undefined
let fallingSequenceTimeline: gsap.core.Timeline | undefined
let sceneElevenTimeline: gsap.core.Timeline | undefined
let pheidiEnterTween: gsap.core.Tween | undefined
let endLoginTween: gsap.core.Tween | undefined
let sceneTransitionAnimation: gsap.core.Animation | undefined
let directNavigationFrame: number | undefined
const preloadedImages: HTMLImageElement[] = []
let prefersReducedMotion = false
let isDirectNavigation = false
let isInstantLandingReturn = false

const textEnterFrom = { autoAlpha: 0, y: 16 }
const textEnterTo = {
  autoAlpha: 1,
  y: 0,
  duration: 0.55,
  ease: 'power2.out',
}
const firstSceneTextDelay = 0.22
const portalScenePause = 300

const totalSteps = scenes.length
const currentScene = computed(() => scenes[currentStep.value - 1] ?? scenes[0])
const isDarkScene = computed(
  () => currentStep.value > 0 && currentScene.value.id >= 7 && currentScene.value.id <= 16,
)
const showsPersistentLight = computed(
  () => currentStep.value > 0 && currentScene.value.id >= 8 && currentScene.value.id <= 16,
)

function getStepBySceneId(sceneId: number) {
  const sceneIndex = scenes.findIndex((scene) => scene.id === sceneId)
  return sceneIndex >= 0 ? sceneIndex + 1 : currentStep.value
}

function updateToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  todayDisplay.value = `${year}.${month}.${day}`
  todayDateTime.value = `${year}-${month}-${day}`
}

function cancelStoryAnimations() {
  if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
  if (portalSequenceTimer !== undefined) window.clearTimeout(portalSequenceTimer)
  sceneTransitionAnimation?.progress(1)
  sceneTransitionAnimation = undefined
  portalTimeline?.kill()
  fallingSequenceTimeline?.kill()
  sceneElevenTimeline?.kill()
  pheidiEnterTween?.kill()
  endLoginTween?.kill()
  if (portalTransition.value) gsap.set(portalTransition.value, { autoAlpha: 0 })
  isChanging.value = false
}

async function goToStep(targetStep: number) {
  if (targetStep < 0 || targetStep > totalSteps) return

  cancelStoryAnimations()
  isDirectNavigation = true
  currentStep.value = targetStep
  const targetSceneId = targetStep > 0 ? (scenes[targetStep - 1]?.id ?? 0) : 0
  animateBackground(targetSceneId, true)

  await nextTick()
  if (directNavigationFrame !== undefined) window.cancelAnimationFrame(directNavigationFrame)
  directNavigationFrame = window.requestAnimationFrame(() => {
    const directStoryScene = mainPage.value?.querySelector('.story-scene')
    if (directStoryScene) revealDirectScene(directStoryScene)

    const landing = mainPage.value?.querySelector('.intro-content')
    if (landing) gsap.set(landing, { clearProps: 'opacity,visibility,transform' })

    directNavigationFrame = window.requestAnimationFrame(() => {
      isDirectNavigation = false
    })
  })
}

function changeStep(direction: 1 | -1) {
  if (isChanging.value) return
  const nextStep = Math.min(Math.max(currentStep.value + direction, 0), totalSteps)
  if (nextStep === currentStep.value) return

  const isReturningFromFirstScene = currentStep.value === 1 && nextStep === 0
  if (isReturningFromFirstScene) {
    sceneTransitionAnimation?.progress(1)
    sceneTransitionAnimation = undefined
    isInstantLandingReturn = true
    currentStep.value = 0
    void nextTick(() => {
      isInstantLandingReturn = false
    })
    return
  }

  const isPortalChange =
    (currentStep.value === 6 && nextStep === 7) || (currentStep.value === 7 && nextStep === 6)

  if (isPortalChange && !prefersReducedMotion) {
    playPortalTransition(nextStep)
    return
  }

  currentStep.value = nextStep
  isChanging.value = true
  changeStepTimer = window.setTimeout(() => {
    isChanging.value = false
  }, 700)
}

function continuePortalSequenceToSceneFive() {
  isChanging.value = true
  if (portalSequenceTimer !== undefined) window.clearTimeout(portalSequenceTimer)
  portalSequenceTimer = window.setTimeout(() => {
    currentStep.value = getStepBySceneId(5)
    isChanging.value = false
  }, portalScenePause)
}

function playPortalTransition(nextStep: number) {
  const isReturningToSceneSix =
    currentStep.value === getStepBySceneId(7) && nextStep === getStepBySceneId(6)

  if (!portalTransition.value || !portalCurtain.value || !portalHole.value) {
    currentStep.value = nextStep
    if (isReturningToSceneSix) continuePortalSequenceToSceneFive()
    else isChanging.value = false
    return
  }

  const isEnteringDarkScene = currentStep.value === 6 && nextStep === 7
  const holeTravel = window.innerHeight * -0.72
  isChanging.value = true
  portalTimeline?.kill()

  if (isEnteringDarkScene) {
    const sourceHole = mainPage.value?.querySelector('.hole')
    if (sourceHole) gsap.set(sourceHole, { autoAlpha: 0 })

    gsap.set(portalTransition.value, { autoAlpha: 1 })
    gsap.set(portalCurtain.value, { yPercent: 100 })
    gsap.set(portalHole.value, { autoAlpha: 1, y: 0 })

    portalTimeline = gsap
      .timeline({
        onComplete: () => {
          gsap.set(portalTransition.value, { autoAlpha: 0 })
          isChanging.value = false
        },
      })
      .to(portalCurtain.value, { yPercent: 0, duration: 0.72, ease: 'power2.inOut' }, 0)
      .to(portalHole.value, { y: holeTravel, duration: 0.72, ease: 'power2.inOut' }, 0)
      .call(
        () => {
          currentStep.value = 7
        },
        undefined,
        0.68,
      )

    return
  }

  currentStep.value = 6
  void nextTick(() => {
    const sourceHole = mainPage.value?.querySelector('.hole')
    if (sourceHole) gsap.set(sourceHole, { autoAlpha: 0 })

    gsap.set(portalTransition.value, { autoAlpha: 1 })
    gsap.set(portalCurtain.value, { yPercent: 0 })
    gsap.set(portalHole.value, { autoAlpha: 1, y: holeTravel })

    portalTimeline = gsap
      .timeline({
        onComplete: () => {
          if (sourceHole) gsap.set(sourceHole, { autoAlpha: 1 })
          gsap.set(portalTransition.value, { autoAlpha: 0 })
          continuePortalSequenceToSceneFive()
        },
      })
      .to(portalCurtain.value, { yPercent: 100, duration: 0.72, ease: 'power2.inOut' }, 0)
      .to(portalHole.value, { y: 0, duration: 0.72, ease: 'power2.inOut' }, 0)
  })
}

function getColorToken(token: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

function animateBackground(step: number, immediate = false) {
  if (!mainPage.value) return

  const isDark = step >= 7 && step <= 16
  gsap.to(mainPage.value, {
    backgroundColor: getColorToken(isDark ? '--color-dark' : '--color-primary-pale'),
    duration: prefersReducedMotion || immediate ? 0 : 0.7,
    ease: 'power2.inOut',
    overwrite: true,
  })
}

function handleBeforeSceneEnter(element: Element) {
  if (prefersReducedMotion || isDirectNavigation) {
    revealDirectScene(element)
    return
  }
  gsap.set(element, { autoAlpha: 0 })
}

function revealDirectScene(element: Element) {
  const sceneElements = [
    element,
    ...element.querySelectorAll('.story-text, .story-layer, .end-login'),
  ]

  gsap.killTweensOf(sceneElements)
  gsap.set(sceneElements, { clearProps: 'opacity,visibility,transform' })
  gsap.set(element, { autoAlpha: 1 })

  const alwaysVisibleElements = element.querySelectorAll('.pheidi--reveal, .end-login')
  if (alwaysVisibleElements.length) gsap.set(alwaysVisibleElements, { autoAlpha: 1 })
}

function handleSceneEnter(element: Element, done: () => void) {
  if (prefersReducedMotion || isDirectNavigation) {
    revealDirectScene(element)
    done()
    return
  }

  const dailyChrome = element.querySelectorAll('.daily-header, .daily-divider')
  const text = element.querySelector('.story-text')
  const layers = element.querySelectorAll('.story-layer')
  const timeline = gsap.timeline({
    onComplete: () => {
      sceneTransitionAnimation = undefined
      done()
    },
  })
  sceneTransitionAnimation = timeline

  timeline.to(element, {
    autoAlpha: 1,
    duration: 0.32,
    ease: 'power2.out',
  })
  if (dailyChrome.length) {
    timeline.from(dailyChrome, { autoAlpha: 0, y: 14, duration: 0.3, stagger: 0.04 }, '-=0.2')
  }
  if (text) {
    timeline.fromTo(text, textEnterFrom, textEnterTo, firstSceneTextDelay)
  }
  if (layers.length) {
    timeline.from(layers, { autoAlpha: 0, duration: 0.4, stagger: 0.05 }, '-=0.28')
  }
}

function handleSceneLeave(element: Element, done: () => void) {
  if (isInstantLandingReturn) {
    gsap.killTweensOf(element)
    sceneTransitionAnimation = undefined
    isInstantLandingReturn = false
    done()
    return
  }

  if (prefersReducedMotion || isDirectNavigation) {
    done()
    return
  }

  sceneTransitionAnimation = gsap.to(element, {
    autoAlpha: 0,
    duration: 0.28,
    ease: 'power2.in',
    onComplete: () => {
      sceneTransitionAnimation = undefined
      done()
    },
  })
}

function animateScrollHint() {
  scrollHintTween?.kill()
  if (!mouseWheel.value || prefersReducedMotion) return

  scrollHintTween = gsap.fromTo(
    mouseWheel.value,
    { autoAlpha: 0.35, y: 0 },
    { autoAlpha: 1, y: 10, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true },
  )
}

function preloadIntroImages() {
  for (const fileName of ['falling-2.4.png', 'running-2.png']) {
    const image = new Image()
    image.src = imagePath(fileName)
    void image.decode().catch(() => undefined)
    preloadedImages.push(image)
  }
}

function handleWheel(event: WheelEvent) {
  if (Math.abs(event.deltaY) >= 10) changeStep(event.deltaY > 0 ? 1 : -1)
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
  const distance = touchStartY.value - (event.changedTouches[0]?.clientY ?? touchStartY.value)
  if (Math.abs(distance) >= 50) changeStep(distance > 0 ? 1 : -1)
}

onMounted(() => {
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  updateToday()
  dateUpdateTimer = window.setInterval(updateToday, 60_000)
  window.addEventListener('keydown', handleKeydown)
  preloadIntroImages()
  animateBackground(currentStep.value)
  animateScrollHint()
})

watch(currentStep, async (step, previousStep) => {
  const sceneId = scenes[step - 1]?.id ?? scenes[0].id
  const previousSceneId = previousStep > 0 ? (scenes[previousStep - 1]?.id ?? 0) : 0
  const isDirectStoryChange =
    sceneId >= 3 && sceneId <= 11 && previousSceneId >= 3 && previousSceneId <= 11

  animateBackground(sceneId, isDirectNavigation || isDirectStoryChange)
  await nextTick()

  if (isDirectNavigation) {
    animateScrollHint()
    return
  }

  if (sceneId === 6 && previousSceneId === 5) {
    if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
    isChanging.value = true
    if (portalSequenceTimer !== undefined) window.clearTimeout(portalSequenceTimer)
    portalSequenceTimer = window.setTimeout(() => {
      if (prefersReducedMotion) {
        currentStep.value = getStepBySceneId(7)
        isChanging.value = false
      } else {
        playPortalTransition(getStepBySceneId(7))
      }
    }, portalScenePause)
  }

  if (sceneId === 6 && previousSceneId === 7 && prefersReducedMotion) {
    if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
    continuePortalSequenceToSceneFive()
  }

  if (sceneId === 10 && previousSceneId === 8) {
    if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
    isChanging.value = true

    if (prefersReducedMotion) {
      currentStep.value = getStepBySceneId(11)
      isChanging.value = false
      return
    }

    const sequenceStart = mainPage.value?.querySelector('.falling-sequence--start')
    const sequenceEnd = mainPage.value?.querySelector('.falling-sequence--end')

    if (sequenceStart && sequenceEnd) {
      const fallingSequenceImages = [sequenceStart, sequenceEnd]
      const viewportHeight = window.innerHeight

      fallingSequenceTimeline?.kill()
      gsap.set(fallingSequenceImages, { y: 0 })
      gsap.set(sequenceStart, { autoAlpha: 1 })
      gsap.set(sequenceEnd, { autoAlpha: 0 })

      fallingSequenceTimeline = gsap
        .timeline({
          onComplete: () => {
            currentStep.value = getStepBySceneId(11)
          },
        })
        .to(fallingSequenceImages, { y: viewportHeight * 0.9, duration: 2.6, ease: 'power1.in' }, 0)
        .to(sequenceStart, { autoAlpha: 0, duration: 1, ease: 'sine.inOut' }, 0.55)
        .to(sequenceEnd, { autoAlpha: 1, duration: 1, ease: 'sine.inOut' }, 0.55)
    } else {
      currentStep.value = getStepBySceneId(11)
      isChanging.value = false
    }
  }

  if (sceneId === 11 && [10, 12].includes(previousSceneId) && !prefersReducedMotion) {
    if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
    isChanging.value = true
    const sceneElevenContent = mainPage.value?.querySelectorAll('.look-one, .story-text')

    if (sceneElevenContent?.length) {
      sceneElevenTimeline?.kill()
      sceneElevenTimeline = gsap
        .timeline({
          delay: 0.3,
          onComplete: () => {
            isChanging.value = false
          },
        })
        .fromTo(
          sceneElevenContent,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.9, ease: 'power2.out', stagger: 0.08 },
        )
    } else {
      isChanging.value = false
    }
  }

  if (sceneId === 13) {
    const pheidiImage = mainPage.value?.querySelector('.pheidi--reveal')

    if (previousSceneId === 12 && pheidiImage && !prefersReducedMotion) {
      if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
      isChanging.value = true
      pheidiEnterTween?.kill()
      pheidiEnterTween = gsap.fromTo(
        pheidiImage,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 1.1,
          ease: 'power2.out',
          overwrite: true,
          onComplete: () => {
            isChanging.value = false
          },
        },
      )
    } else {
      if (pheidiImage) gsap.set(pheidiImage, { autoAlpha: 1 })
      if (previousSceneId === 12) isChanging.value = false
    }
  }

  if (sceneId === 18) {
    const endLogin = mainPage.value?.querySelector('.end-login')

    if (previousSceneId === 17 && endLogin && !prefersReducedMotion) {
      endLoginTween?.kill()
      endLoginTween = gsap.fromTo(
        endLogin,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.65, ease: 'power2.out', overwrite: true },
      )
    } else if (endLogin) {
      gsap.set(endLogin, { autoAlpha: 1 })
    }
  }

  const isDailyTextChange =
    sceneId >= 1 && sceneId <= 3 && previousSceneId >= 1 && previousSceneId <= 3 && storyText.value

  if (isDailyTextChange && !prefersReducedMotion) {
    gsap.fromTo(storyText.value, textEnterFrom, {
      ...textEnterTo,
      delay: firstSceneTextDelay,
      overwrite: true,
    })
  }

  animateScrollHint()
})

onBeforeUnmount(() => {
  if (dateUpdateTimer !== undefined) window.clearInterval(dateUpdateTimer)
  if (changeStepTimer !== undefined) window.clearTimeout(changeStepTimer)
  if (portalSequenceTimer !== undefined) window.clearTimeout(portalSequenceTimer)
  if (directNavigationFrame !== undefined) window.cancelAnimationFrame(directNavigationFrame)
  scrollHintTween?.kill()
  portalTimeline?.kill()
  fallingSequenceTimeline?.kill()
  sceneElevenTimeline?.kill()
  pheidiEnterTween?.kill()
  endLoginTween?.kill()
  sceneTransitionAnimation?.kill()
  preloadedImages.splice(0)
  gsap.killTweensOf(mainPage.value)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main
    ref="mainPage"
    class="intro-page"
    aria-live="polite"
    @wheel.prevent="handleWheel"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <h1 class="sr-only">跑者菲迪 Pheidi the Runner</h1>

    <img
      v-if="showsPersistentLight"
      src="/images/intro/light.png"
      alt=""
      class="persistent-light light"
      aria-hidden="true"
    />

    <section v-if="currentStep === 0" key="landing" class="intro-content">
      <img src="/logo-1.svg" alt="跑者菲迪 Pheidi the Runner" class="intro-logo" />
      <RouterLink v-slot="{ navigate }" to="/login" custom>
        <BaseButton label="LOGIN" class="intro-login" @click="navigate" />
      </RouterLink>
    </section>

    <Transition
      mode="out-in"
      :css="false"
      @before-enter="handleBeforeSceneEnter"
      @enter="handleSceneEnter"
      @leave="handleSceneLeave"
    >
      <section
        v-if="currentStep > 0"
        key="story"
        class="story-scene"
        :aria-label="`故事第 ${currentStep} 段，共 ${scenes.length} 段`"
      >
        <header v-if="currentScene.showDaily" class="daily-header">
          <h2 class="daily-header__title">菲迪日報</h2>
          <time class="daily-header__date" :datetime="todayDateTime">{{ todayDisplay }}</time>
        </header>
        <div v-if="currentScene.showDaily" class="daily-divider" aria-hidden="true"></div>

        <p
          v-if="currentScene.text"
          ref="storyText"
          class="story-text"
          :class="[
            `story-text--step-${currentScene.id}`,
            { 'story-text--runner': currentScene.tone === 'runner' },
          ]"
        >
          {{ currentScene.text }}
        </p>

        <div class="story-visual">
          <img
            v-for="layer in currentScene.layers"
            :key="layer.image"
            :src="layer.image"
            :alt="layer.alt ?? ''"
            class="story-layer"
            :class="layer.className"
          />
        </div>

        <RouterLink v-if="currentStep === totalSteps" v-slot="{ navigate }" to="/login" custom>
          <BaseButton label="LOGIN" class="intro-login end-login" @click="navigate" />
        </RouterLink>
      </section>
    </Transition>

    <div ref="portalTransition" class="portal-transition" aria-hidden="true">
      <div ref="portalCurtain" class="portal-curtain"></div>
      <img ref="portalHole" src="/images/intro/falling-1.2.png" alt="" class="portal-hole" />
    </div>

    <button
      v-if="currentStep > 0"
      type="button"
      class="corner-logo-button"
      aria-label="返回 Intro 入口"
      @click="goToStep(0)"
    >
      <img src="/logo-2.svg" alt="" class="corner-logo-image" />
    </button>
    <img
      v-if="currentStep > 0"
      src="/tagline.svg"
      alt="Start grow with you"
      class="corner-tagline"
    />

    <div
      v-if="currentStep < totalSteps"
      class="scroll-hint"
      :class="{ 'scroll-hint--dark': isDarkScene }"
      aria-hidden="true"
    >
      <span class="mouse-icon"><span ref="mouseWheel" class="mouse-wheel"></span></span>
      <span class="scroll-text">Scroll to play</span>
    </div>

    <nav v-if="currentStep > 0" class="scene-progress" aria-label="故事分鏡導覽">
      <button
        v-for="step in totalSteps"
        :key="step"
        type="button"
        class="progress-dot"
        :class="{ 'progress-dot--active': step === currentStep }"
        :aria-label="`前往故事第 ${scenes[step - 1]?.id} 幕`"
        :aria-current="step === currentStep ? 'step' : undefined"
        @click="goToStep(step)"
      ></button>
    </nav>
  </main>
</template>

<style scoped>
.intro-page {
  --story-art-size: min(64vw, 44svh);
  --story-art-top: 61%;
  --story-text-size: clamp(var(--font-size-sm), 1.25vw, var(--font-size-md));
  --story-text-top: 29vh;

  position: relative;
  display: grid;
  place-items: center;
  min-height: 100svh;
  padding: var(--space-4);
  overflow: hidden;
  overscroll-behavior: none;
  background: var(--color-primary-pale);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  touch-action: pan-y;
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

.corner-logo-button,
.corner-tagline {
  position: absolute;
  bottom: clamp(var(--space-5), 3vw, var(--space-7));
  z-index: 2;
  width: clamp(64px, 6vw, 100px);
  height: auto;
  opacity: 0.5;
}

.corner-logo-button {
  left: clamp(var(--space-5), 3vw, var(--space-7));
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.corner-logo-image {
  display: block;
  width: 100%;
  height: auto;
}

.corner-logo-button:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: var(--space-1);
}
.corner-tagline {
  right: clamp(var(--space-5), 3vw, var(--space-7));
}

.intro-login {
  position: relative;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-width: 100px;
  min-height: 45px;
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  border-radius: var(--radius-full);
}

.story-scene,
.story-visual {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.daily-header {
  position: absolute;
  top: clamp(var(--space-7), 12vh, 7.5rem);
  left: 50%;
  z-index: 2;
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
  z-index: 2;
  width: min(100%, 56rem);
  height: 1px;
  background-color: var(--color-primary-soft);
  transform: translateX(-50%);
}

.story-text {
  position: absolute;
  top: var(--story-text-top);
  left: 50%;
  z-index: 2;
  width: min(calc(100% - (var(--space-6) * 2)), 48rem);
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: var(--story-text-size);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
  text-align: center;
  white-space: pre-line;
  text-wrap: balance;
  transform: translateX(-50%);
}

.story-text--runner {
  color: var(--color-secondary);
}

.story-text--step-18 {
  color: var(--color-accent);
}

.story-visual {
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.story-layer {
  position: absolute;
  top: var(--story-art-top);
  left: 50%;
  width: var(--story-art-size);
  height: var(--story-art-size);
  object-fit: contain;
  transform: translate(-50%, -50%);
}

.coins,
.falling-sequence {
  top: 30%;
}

.falling-sequence--end {
  visibility: hidden;
  opacity: 0;
}

.light {
  top: 50%;
  width: 112svh;
  height: 112svh;
  opacity: 0.62;
}

.persistent-light {
  position: absolute;
  left: 50%;
  z-index: 0;
  object-fit: contain;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.pheidi--reveal {
  visibility: hidden;
  opacity: 0;
}

.portal-transition {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}

.portal-curtain {
  position: absolute;
  inset: 0;
  background: var(--color-dark);
}

.portal-hole {
  position: absolute;
  top: var(--story-art-top);
  left: 50%;
  z-index: 1;
  width: var(--story-art-size);
  height: var(--story-art-size);
  object-fit: contain;
  transform: translate(-50%, -50%);
}

.end-login {
  --base-button-translate-x: -50%;

  position: absolute;
  top: 17vh;
  left: 50%;
  z-index: 4;
  visibility: hidden;
  opacity: 0;
}

.scroll-hint {
  position: absolute;
  bottom: clamp(var(--space-6), 5vh, 3.5rem);
  left: 50%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-primary);
  opacity: 0.5;
  pointer-events: none;
  transform: translateX(-50%);
}

.mouse-icon {
  display: flex;
  justify-content: center;
  width: 28px;
  height: 42px;
  padding-top: 5px;
  border: 2px solid currentcolor;
  border-radius: var(--radius-full);
}

.mouse-wheel {
  width: 2px;
  height: var(--space-2);
  background: currentcolor;
  border-radius: var(--radius-full);
}

.scroll-text {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
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
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.8vh, var(--space-3));
  transform: translateY(-50%);
}

.progress-dot {
  position: relative;
  width: var(--space-2);
  height: var(--space-2);
  flex: 0 0 auto;
  padding: 0;
  cursor: pointer;
  background: color-mix(in srgb, var(--color-primary) 35%, transparent);
  border: 0;
  border-radius: 50%;
  transition:
    height 300ms ease,
    background-color 300ms ease;
}

.progress-dot::before {
  position: absolute;
  inset: -4px -8px;
  content: '';
}

.progress-dot:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.progress-dot--active {
  height: 28px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
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
  .corner-logo-button,
  .corner-tagline {
    bottom: 20px;
    width: 64px;
  }
  .corner-logo-button {
    left: 20px;
  }
  .corner-tagline {
    right: 20px;
  }
  .intro-login {
    min-width: 90px;
    min-height: 35px;
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
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
  .story-text {
    width: calc(100% - (var(--space-5) * 2));
  }
  .light {
    width: 126svh;
    height: 126svh;
  }
  .end-login {
    top: 15vh;
  }
  .scroll-hint {
    bottom: var(--space-5);
    gap: var(--space-3);
  }
  .mouse-icon {
    width: 26px;
    height: 38px;
    padding-top: var(--space-1);
  }
  .scroll-text {
    font-size: 0.6875rem;
  }
  .scene-progress {
    right: var(--space-4);
    gap: 4px;
  }
  .progress-dot {
    width: 6px;
    height: 6px;
  }
  .progress-dot--active {
    height: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-dot {
    transition: none;
  }
}
</style>
