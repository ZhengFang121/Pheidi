<template>
  <header class="header">
    <div class="logo">🏃 Pheidi</div>

    <nav class="nav">
      <RouterLink class="nav-link" to="/"> 首頁 </RouterLink>

      <RouterLink class="nav-link" to="/player"> 玩家 </RouterLink>

      <RouterLink class="nav-link" to="/quest"> 任務 </RouterLink>

      <RouterLink class="nav-link" to="/community"> 交流大廳 </RouterLink>
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
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-b);
  color: var(--color-text);
}

.nav {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;

  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-m);

  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: var(--font-weight-b);
}
</style>
