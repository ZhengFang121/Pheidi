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

      <div class="app-footer__signature">
        <span
          class="app-footer__tagline"
          aria-hidden="true"
        ></span>

        <p class="app-footer__copyright">© 2026 PHEIDI THE RUNNER</p>
      </div>
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
}

.app-footer__scene {
  --footer-grass-size: clamp(48rem, 142vw, 168rem);
  --footer-runner-size: clamp(8.25rem, 10.833vw, 9.75rem);
  --footer-scene-trim: var(--space-8);

  position: relative;
  height: calc(clamp(22.5rem, 28vw, 25.5rem) - var(--space-4));
  overflow: hidden;
}

.app-footer__grass-position {
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--footer-grass-size);
  max-width: none;
  aspect-ratio: 1;
  /*
   * The furthest opaque pixel is 48.1% of the image size from its center.
   * Keep that full rotation envelope below the scene's clipping edge.
   */
  transform: translate(-50%, -1.5%);
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
  top: calc(
    clamp(9.75rem, 13.08vw, 11.75rem) - var(--footer-scene-trim) - var(--space-4)
  );
  left: 50%;
  display: block;
  width: var(--footer-runner-size);
  height: auto;
  aspect-ratio: 1;
  transform: translateX(-50%);
}

.app-footer__copyright {
  position: static;
  width: auto;
  margin: 0;
  padding: 0;

  color: var(--color-surface);
  text-align: center;
  letter-spacing: var(--letter-spacing-wide);
  font-size: var(--font-size-sm);
  transform: none;
}

.app-footer__signature {
  position: absolute;
  right: 0;
  bottom: var(--space-4);
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.app-footer__tagline {
  display: block;
  width: clamp(6.5rem, 8vw, 7.5rem);
  aspect-ratio: 142 / 80;
  background-color: var(--color-primary-pale);
  mask: url('/tagline.svg') center / contain no-repeat;
  transform: translateY(calc(-1 * var(--space-4)));
  -webkit-mask: url('/tagline.svg') center / contain no-repeat;
}

@media (max-width: 480px) {
  .app-footer__scene {
    --footer-grass-size: 165vw;
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
