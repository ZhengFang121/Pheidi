<template>
  <header class="header">
    <RouterLink to="/" class="logo">
      <img src="/logo.svg" alt="跑者菲迪" />
    </RouterLink>

    <nav class="nav">
      <RouterLink class="nav-link" to="/">
        <span class="nav-label">首頁</span>
        <span class="nav-label-en">Home</span>
      </RouterLink>

      <RouterLink class="nav-link" to="/player">
        <span class="nav-label">足跡驛站</span>
        <span class="nav-label-en">Trail Station</span>
      </RouterLink>

      <RouterLink class="nav-link" to="/quest">
        <span class="nav-label">跑者學院</span>
        <span class="nav-label-en">Runner Academy</span>
      </RouterLink>

      <RouterLink class="nav-link" to="/community">
        <span class="nav-label">菲迪廣場</span>
        <span class="nav-label-en">Pheidi Plaza</span>
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  height: 70px;
  padding: 0 40px;

  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo img {
  height: 55px;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  color: var(--color-text);
  text-decoration: none;

  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);

  transition: color 0.2s ease;
}

.nav-label {
  font-size: var(--font-size-base);
  line-height: 1.2;
}

.nav-label-en {
  font-size: 12px;
  line-height: 1.2;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}
</style>
