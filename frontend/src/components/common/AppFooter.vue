<template>
  <footer class="app-footer">
    <div class="app-footer__scene">
      <div class="app-footer__grass-position" aria-hidden="true">
        <img
          class="app-footer__grass"
          :src="grasslandUrl"
          alt=""
          width="1500"
          height="1500"
          loading="lazy"
          decoding="async"
        />
      </div>

      <img
        class="app-footer__runner"
        src="/images/intro/running-2.png"
        alt=""
        aria-hidden="true"
        width="480"
        height="480"
        loading="lazy"
        decoding="async"
      />

      <p class="app-footer__copyright">© 2026 PHEIDI THE RUNNER</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import grasslandUrl from '@/assets/images/grassland.png'
</script>

<style scoped>
.app-footer {
  width: 100%;
  overflow: hidden;
  color: var(--color-secondary-light);
  background: var(--color-secondary-soft);
}

.app-footer__scene {
  --footer-grass-size: clamp(48rem, 142vw, 168rem);
  --footer-grass-lift: clamp(0rem, calc(12.8vw - 11.5rem), 3.625rem);
  --footer-runner-size: clamp(8.25rem, 10.833vw, 9.75rem);
  --footer-scene-trim: var(--space-8);

  position: relative;
  height: calc(clamp(22.5rem, 28vw, 25.5rem) - var(--space-4));
  overflow: hidden;
}

.app-footer__grass-position {
  position: absolute;
  top: calc(
    clamp(1.375rem, 1.67vw, 1.5rem) - var(--footer-scene-trim) - var(--footer-grass-lift)
  );
  left: 50%;
  width: var(--footer-grass-size);
  max-width: none;
  aspect-ratio: 1;
  transform: translateX(-50%);
}

.app-footer__grass {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  transform-origin: center center;
  animation: app-footer-grass-rotation 200s linear infinite;
  will-change: transform;
}

.app-footer__runner {
  position: absolute;
  top: calc(clamp(9.75rem, 13.08vw, 11.75rem) - var(--footer-scene-trim));
  left: 50%;
  display: block;
  width: var(--footer-runner-size);
  height: auto;
  aspect-ratio: 1;
  transform: translateX(-50%);
}

.app-footer__copyright {
  position: absolute;
  top: calc(clamp(16.75rem, 23.33vw, 21rem) - var(--footer-scene-trim));
  left: 50%;
  z-index: 1;
  width: calc(100% - var(--space-6));
  margin: 0;
  padding: 0 var(--space-3);

  color: var(--color-secondary-pale);
  text-align: center;
  letter-spacing: var(--letter-spacing-wide);
  font-size: var(--font-size-sm);
  transform: translateX(-50%);
}

@media (max-width: 480px) {
  .app-footer__scene {
    --footer-grass-size: 165vw;
    --footer-grass-lift: var(--space-2);
    --footer-runner-size: 7.75rem;
  }
}

@keyframes app-footer-grass-rotation {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-footer__grass {
    animation: none;
    will-change: auto;
  }
}
</style>
