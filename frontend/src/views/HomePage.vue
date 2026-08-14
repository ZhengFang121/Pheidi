<script setup lang="ts">
import Carousel from 'primevue/carousel'
import { ArrowRight, CloudSun, Footprints, MapPin, Sparkles, Sun, Wind } from '@lucide/vue'
import PlayerOverview from '@/components/home/PlayerOverview.vue'

interface HeroSlide {
  id: number
  type: 'greeting' | 'weather' | 'mission'
  eyebrow: string
  title: string
  description: string
  buttonLabel?: string
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    type: 'greeting',
    eyebrow: 'ALLY’S GREETING',
    title: '午安，跑者！',
    description: '今天想用什麼步調前進呢？不用急著跑得很遠，願意出發就是很棒的開始。',
  },
  {
    id: 2,
    type: 'weather',
    eyebrow: 'TODAY’S WEATHER',
    title: '今天適合輕鬆跑',
    description: '午後天氣舒適，但陽光仍然明顯。出門前記得補充水分，也可以選擇傍晚再出發。',
    buttonLabel: '查看詳細天氣',
  },
  {
    id: 3,
    type: 'mission',
    eyebrow: 'TODAY’S MISSION',
    title: '輕鬆跑 20 分鐘',
    description: '今天不用追求速度，找到能夠自在呼吸、舒服前進的節奏就好。',
    buttonLabel: '開始今日任務',
  },
]

function handleSlideAction(slide: HeroSlide) {
  if (slide.type === 'weather') {
    console.log('查看詳細天氣')
  }

  if (slide.type === 'mission') {
    console.log('開始今日任務')
  }
}
</script>

<template>
  <main class="home-page">
    <section class="home-hero layout-container" aria-label="今日跑步資訊">
      <Carousel
        :value="heroSlides"
        :num-visible="1"
        :num-scroll="1"
        :autoplay-interval="6000"
        :show-navigators="true"
        :show-indicators="true"
        circular
      >
        <template #item="{ data }">
          <article class="hero-slide" :class="`hero-slide--${data.type}`">
            <div class="hero-slide__content">
              <p class="hero-slide__eyebrow">
                <Sparkles :size="16" :stroke-width="2" />

                {{ data.eyebrow }}
              </p>

              <h1 class="hero-slide__title">
                {{ data.title }}
              </h1>

              <p class="hero-slide__description">
                {{ data.description }}
              </p>

              <!-- 今日天氣資訊 -->
              <div v-if="data.type === 'weather'" class="weather-summary">
                <div class="weather-summary__temperature">
                  <CloudSun :size="36" :stroke-width="1.8" />

                  <div>
                    <strong>26°C</strong>
                    <span>體感 27°C</span>
                  </div>
                </div>

                <div class="weather-summary__details">
                  <span>
                    <Sun :size="17" />
                    降雨 20%
                  </span>

                  <span>
                    <Wind :size="17" />
                    微風 2 級
                  </span>

                  <span>
                    <MapPin :size="17" />
                    台北市
                  </span>
                </div>
              </div>

              <!-- 今日任務資訊 -->
              <div v-if="data.type === 'mission'" class="mission-summary">
                <span class="mission-summary__tag">
                  <Footprints :size="16" />
                  輕鬆
                </span>

                <span>約 2–3 公里</span>
                <span>＋20 成長足跡</span>
              </div>

              <button
                v-if="data.buttonLabel"
                class="hero-slide__button"
                type="button"
                @click="handleSlideAction(data)"
              >
                {{ data.buttonLabel }}

                <ArrowRight :size="18" :stroke-width="2.2" />
              </button>
            </div>

            <!-- 右側視覺 -->
            <div class="hero-slide__visual" aria-hidden="true">
              <!-- 阿里問候 -->
              <div v-if="data.type === 'greeting'" class="ally-illustration">
                <span class="ally-illustration__spark ally-illustration__spark--one" />

                <span class="ally-illustration__spark ally-illustration__spark--two" />

                <div class="ally-illustration__body">
                  <Wind :size="88" :stroke-width="1.25" />
                </div>

                <p>阿里正在等你出發！</p>
              </div>

              <!-- 天氣 -->
              <div v-else-if="data.type === 'weather'" class="weather-illustration">
                <span class="weather-illustration__sun">
                  <Sun :size="112" :stroke-width="1.2" />
                </span>

                <span class="weather-illustration__cloud">
                  <CloudSun :size="150" :stroke-width="1.2" />
                </span>
              </div>

              <!-- 任務 -->
              <div v-else class="mission-illustration">
                <span class="mission-illustration__route" />

                <span class="mission-illustration__step mission-illustration__step--one">
                  <Footprints :size="52" :stroke-width="1.35" />
                </span>

                <span class="mission-illustration__step mission-illustration__step--two">
                  <Footprints :size="70" :stroke-width="1.35" />
                </span>

                <span class="mission-illustration__finish"> GO! </span>
              </div>
            </div>
          </article>
        </template>
      </Carousel>
    </section>

    <PlayerOverview class="layout-container" />

  </main>
</template>

<style scoped>
.home-page {
  min-height: 100%;
  padding-block: var(--space-5, 48px);
  background-color: var(--color-background, #ffffff);
}

.home-hero {
  width: 100%;
}

/* 輪播卡片 */

.hero-slide {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  align-items: center;
  min-height: 500px;
  padding: 64px 96px;
  overflow: hidden;
  border-radius: 32px;
}

/* 三張輪播背景 */

.hero-slide--greeting {
  background:
    radial-gradient(circle at 78% 25%, rgb(255 255 255 / 55%) 0, transparent 30%),
    var(--color-primary-pale, #d4f9f4);
}

.hero-slide--weather {
  background:
    radial-gradient(circle at 78% 22%, rgb(255 255 255 / 60%) 0, transparent 32%),
    var(--color-accent-pale, #fff6de);
}

.hero-slide--mission {
  background:
    radial-gradient(circle at 78% 25%, rgb(255 255 255 / 55%) 0, transparent 30%),
    var(--color-secondary-pale, #ebf4e1);
}

/* 左側文字 */

.hero-slide__content {
  position: relative;
  z-index: 2;
  max-width: 620px;
}

.hero-slide__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 var(--space-3, 24px);
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
  font-weight: var(--font-weight-b, 700);
  letter-spacing: var(--letter-spacing-wide, 0.2em);
}

.hero-slide__title {
  margin: 0;
  color: var(--color-text, #3c435e);
  font-size: clamp(36px, 4vw, 56px);
  font-weight: var(--font-weight-b, 700);
  line-height: 1.2;
  letter-spacing: var(--letter-spacing-tight, 0.05em);
}

.hero-slide__description {
  max-width: 570px;
  margin: var(--space-3, 24px) 0 0;
  color: var(--color-text-secondary, #6b7280);
  font-size: 16px;
  line-height: 1.7;
  letter-spacing: var(--letter-spacing-base, 0.1em);
}

/* CTA 按鈕 */

.hero-slide__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  margin-top: var(--space-4, 32px);
  padding: 12px 22px;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  background-color: var(--color-dark, #3c435e);
  font: inherit;
  font-weight: var(--font-weight-b, 700);
  letter-spacing: var(--letter-spacing-base, 0.1em);
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}

.hero-slide__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgb(60 67 94 / 18%);
}

.hero-slide__button:focus-visible {
  outline: 3px solid rgb(60 67 94 / 25%);
  outline-offset: 4px;
}

/* 天氣資訊 */

.weather-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3, 24px);
  margin-top: var(--space-4, 32px);
}

.weather-summary__temperature {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-accent, #ff9c46);
}

.weather-summary__temperature div {
  display: grid;
}

.weather-summary__temperature strong {
  color: var(--color-text, #3c435e);
  font-size: 28px;
  line-height: 1.2;
}

.weather-summary__temperature span {
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}

.weather-summary__details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.weather-summary__details span,
.mission-summary span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 999px;
  color: var(--color-text-secondary, #6b7280);
  background-color: rgb(255 255 255 / 58%);
  font-size: 13px;
}

/* 任務資訊 */

.mission-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: var(--space-4, 32px);
}

.mission-summary .mission-summary__tag {
  color: var(--color-text, #3c435e);
  background-color: rgb(255 255 255 / 80%);
  font-weight: var(--font-weight-b, 700);
}

/* 右側視覺 */

.hero-slide__visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 350px;
}

/* 阿里暫時示意圖 */

.ally-illustration {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 20px;
}

.ally-illustration__body {
  display: grid;
  place-items: center;
  width: 230px;
  aspect-ratio: 1;
  border: 3px solid rgb(91 208 212 / 50%);
  border-radius: 45% 55% 52% 48% / 55% 42% 58% 45%;
  color: var(--color-primary, #5bd0d4);
  background-color: rgb(255 255 255 / 58%);
  box-shadow: 0 24px 50px rgb(91 208 212 / 15%);
  transform: rotate(-4deg);
}

.ally-illustration p {
  margin: 0;
  color: var(--color-text, #3c435e);
  font-weight: var(--font-weight-b, 700);
  letter-spacing: var(--letter-spacing-base, 0.1em);
}

.ally-illustration__spark {
  position: absolute;
  width: 18px;
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: var(--color-accent, #ff9c46);
}

.ally-illustration__spark--one {
  top: 10px;
  right: 10px;
}

.ally-illustration__spark--two {
  bottom: 80px;
  left: 5px;
  width: 11px;
  background-color: var(--color-secondary, #b3ce89);
}

/* 天氣示意圖 */

.weather-illustration {
  position: relative;
  width: 360px;
  min-height: 280px;
  color: var(--color-accent, #ff9c46);
}

.weather-illustration__sun {
  position: absolute;
  top: 5px;
  right: 30px;
  opacity: 0.65;
}

.weather-illustration__cloud {
  position: absolute;
  right: 90px;
  bottom: 35px;
  color: var(--color-primary, #5bd0d4);
}

/* 任務示意圖 */

.mission-illustration {
  position: relative;
  width: 380px;
  min-height: 300px;
}

.mission-illustration__route {
  position: absolute;
  inset: 40px 65px;
  border: 3px dashed rgb(179 206 137 / 65%);
  border-radius: 50%;
  transform: rotate(-18deg);
}

.mission-illustration__step {
  position: absolute;
  color: var(--color-secondary, #b3ce89);
}

.mission-illustration__step--one {
  left: 38px;
  bottom: 50px;
  transform: rotate(25deg);
}

.mission-illustration__step--two {
  top: 30px;
  right: 65px;
  transform: rotate(-18deg);
}

.mission-illustration__finish {
  position: absolute;
  right: 20px;
  bottom: 42px;
  display: grid;
  place-items: center;
  width: 88px;
  aspect-ratio: 1;
  border-radius: 50%;
  color: #ffffff;
  background-color: var(--color-accent, #ff9c46);
  font-size: 22px;
  font-weight: var(--font-weight-b, 700);
  letter-spacing: 0.08em;
  box-shadow: 0 18px 32px rgb(255 156 70 / 22%);
}

/* PrimeVue Carousel */

.home-hero :deep(.p-carousel-content) {
  position: relative;
}

.home-hero :deep(.p-carousel-item) {
  padding: 0;
}

/* 輪播左右箭頭 */

.home-hero :deep(.p-carousel-prev-button),
.home-hero :deep(.p-carousel-next-button) {
  position: absolute;
  z-index: 5;
  top: 50%;
  width: 44px;
  height: 44px;
  border: 1px solid rgb(255 255 255 / 70%);
  color: var(--color-text, #3c435e);
  background-color: rgb(255 255 255 / 75%);
  box-shadow: 0 8px 24px rgb(60 67 94 / 10%);
  transform: translateY(-50%);
  backdrop-filter: blur(8px);
}

.home-hero :deep(.p-carousel-prev-button) {
  left: 16px;
}

.home-hero :deep(.p-carousel-next-button) {
  right: 16px;
}

/* 輪播圓點 */

.home-hero :deep(.p-carousel-indicator-list) {
  gap: 10px;
  padding-top: var(--space-3, 24px);
}

.home-hero :deep(.p-carousel-indicator-button) {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background-color: var(--color-primary-soft, #b4ebe6);
  transition:
    width 180ms ease,
    background-color 180ms ease;
}

.home-hero :deep(.p-carousel-indicator-active .p-carousel-indicator-button) {
  width: 30px;
  background-color: var(--color-primary, #5bd0d4);
}

/* 平板 */

@media (max-width: 900px) {
  .home-page {
    padding-block: var(--space-4, 32px);
  }

  .hero-slide {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 48px 80px;
  }

  .hero-slide__content {
    max-width: none;
  }

  .hero-slide__visual {
    min-height: 300px;
    margin-top: var(--space-4, 32px);
  }
}

/* 手機 */

@media (max-width: 600px) {
  .home-page {
    padding-block: 24px;
  }

  .hero-slide {
    padding: 40px 28px 32px;
    border-radius: 24px;
  }

  .hero-slide__title {
    font-size: 34px;
  }

  .hero-slide__description {
    font-size: 15px;
  }

  .hero-slide__visual {
    min-height: 240px;
  }

  .ally-illustration__body {
    width: 180px;
  }

  .weather-illustration,
  .mission-illustration {
    width: 280px;
    transform: scale(0.85);
  }

  .home-hero :deep(.p-carousel-prev-button),
  .home-hero :deep(.p-carousel-next-button) {
    display: none;
  }
}

/* 減少動態效果 */

@media (prefers-reduced-motion: reduce) {
  .hero-slide__button,
  .home-hero :deep(.p-carousel-indicator-button) {
    transition: none;
  }
}
</style>
