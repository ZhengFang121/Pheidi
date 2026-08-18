<template>
  <main class="intro-page">
    <section class="intro-content" aria-labelledby="intro-title">
      <h1 id="intro-title" class="sr-only">跑者菲迪 Pheidi the Runner</h1>

      <img
        src="/logo.svg"
        alt="跑者菲迪 Pheidi the Runner"
        class="intro-logo"
      />

      <RouterLink to="/login" class="login-link">Login</RouterLink>
    </section>

    <div class="scroll-hint" aria-hidden="true">
      <span class="mouse-icon">
        <span class="mouse-wheel"></span>
      </span>
      <span class="scroll-text">Scroll to play</span>
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
  background: var(--color-primary-pale);
}

.intro-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(48px, 7vh, 72px);
  transform: translateY(-4vh);
}

.intro-logo {
  width: clamp(240px, 24vw, 350px);
  height: auto;
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

.scroll-hint {
  position: absolute;
  bottom: clamp(48px, 7vh, 72px);
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  color: var(--color-primary);
  transform: translateX(-50%);
}

.mouse-icon {
  display: flex;
  justify-content: center;
  width: 52px;
  height: 78px;
  padding-top: 15px;
  border: 2px solid currentcolor;
  border-radius: 999px;
}

.mouse-wheel {
  width: 2px;
  height: 18px;
  background: currentcolor;
  border-radius: 999px;
  animation: scroll-wheel 1.8s ease-in-out infinite;
}

.scroll-text {
  font-family: var(--font-family-base);
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
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
  .intro-content {
    gap: 40px;
    transform: translateY(-7vh);
  }

  .intro-logo {
    width: min(260px, 72vw);
  }

  .login-link {
    min-width: 156px;
    min-height: 52px;
    font-size: 20px;
  }

  .scroll-hint {
    bottom: 32px;
    gap: 16px;
  }

  .mouse-icon {
    width: 42px;
    height: 64px;
    padding-top: 12px;
  }

  .scroll-text {
    font-size: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mouse-wheel {
    animation: none;
  }

  .login-link {
    transition: none;
  }
}
</style>
