<template>
  <main class="intro-page">
    <div class="intro-content">
      <img
        src="/logo.svg"
        alt="跑者菲迪 Pheidi the Runner"
        class="intro-logo"
      />

      <RouterLink to="/" class="start-link">
        進入網站
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.intro-page {
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 100vh;
  padding: var(--space-4);

  background: var(--color-primary-pale);
}

.intro-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);

  text-align: center;
}

.intro-logo {
  width: min(320px, 80vw);
  height: auto;
}

.intro-content h1 {
  margin: 0;

  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: 40px;
  font-weight: var(--font-weight-bold);
}

.start-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 44px;
  padding: 10px 24px;

  color: white;
  text-decoration: none;

  background: var(--color-primary);
  border-radius: 999px;
}

.start-link:hover {
  background: var(--color-accent);
}
</style>